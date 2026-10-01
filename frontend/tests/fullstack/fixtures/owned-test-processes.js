import fs from "node:fs";

/** @typedef {{ pid: number, ppid: number, pgid: number, startTime: string, state: string }} ProcessIdentity */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */
/** @typedef {{ readProcess: (pid: number) => ProcessIdentity | null, listProcesses: () => number[], signal: (pid: number, signal: NodeJS.Signals) => void, pollIntervalMs: number, graceMs: number }} ProcessOperations */
/** @typedef {{ rootPid: number, identities: Map<number, ProcessIdentity>, timer?: NodeJS.Timeout, error?: string }} OwnershipRecord */

/** @param {number} pid @returns {ProcessIdentity | null} */
function readProcStat(pid) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = stat
      .slice(stat.lastIndexOf(")") + 2)
      .trim()
      .split(/\s+/);
    return {
      pid,
      state: fields[0],
      ppid: Number(fields[1]),
      pgid: Number(fields[2]),
      startTime: fields[19],
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ESRCH")
    )
      return null;
    throw error;
  }
}

/** @returns {number[]} */
function listProcPids() {
  return fs
    .readdirSync("/proc")
    .filter((entry) => /^\d+$/.test(entry))
    .map(Number);
}

/** @param {ProcessIdentity} expected @param {ProcessIdentity} actual */
function sameIdentity(expected, actual) {
  return (
    expected.pid === actual.pid &&
    expected.startTime === actual.startTime &&
    expected.pgid === actual.pgid
  );
}

/**
 * Track and clean up only process identities observed as descendants of a
 * detached fake-test leader. PID/start-time checks narrow, but cannot close,
 * the race between verification and signaling without pidfd support.
 * @param {Partial<ProcessOperations>} [overrides]
 */
export function createOwnedTestProcessTracker(overrides = {}) {
  /** @type {ProcessOperations} */
  const ops = {
    readProcess: readProcStat,
    listProcesses: listProcPids,
    signal: (pid, signal) => process.kill(pid, signal),
    pollIntervalMs: 15,
    graceMs: 500,
    ...overrides,
  };
  /** @type {WeakMap<ChildProcess, OwnershipRecord>} */
  const records = new WeakMap();

  /** @param {ChildProcess} child */
  const track = (child) => {
    /** @type {OwnershipRecord} */
    const record = { rootPid: child.pid ?? -1, identities: new Map() };
    records.set(child, record);
    const observe = () => {
      if (record.rootPid < 1) {
        record.error ??= "Owned process has no PID";
        return;
      }
      try {
        let root = record.identities.get(record.rootPid);
        const currentRoot = ops.readProcess(record.rootPid);
        if (!root && currentRoot && currentRoot.pgid === record.rootPid) {
          root = currentRoot;
          record.identities.set(root.pid, root);
        }
        if (
          !root ||
          !currentRoot ||
          !sameIdentity(root, currentRoot) ||
          currentRoot.state === "Z"
        )
          return;
        const candidates = ops
          .listProcesses()
          .map((pid) => ops.readProcess(pid))
          .filter(
            /** @param {ProcessIdentity | null} identity @returns {identity is ProcessIdentity} */
            (identity) =>
              identity !== null &&
              identity.pgid === root.pgid &&
              identity.state !== "Z" &&
              !record.identities.has(identity.pid),
          );
        let discovered = true;
        while (discovered) {
          discovered = false;
          for (const candidate of candidates) {
            if (record.identities.has(candidate.pid)) continue;
            const parent = record.identities.get(candidate.ppid);
            if (!parent) continue;
            const liveParent = ops.readProcess(parent.pid);
            if (
              liveParent &&
              sameIdentity(parent, liveParent) &&
              liveParent.state !== "Z"
            ) {
              record.identities.set(candidate.pid, candidate);
              discovered = true;
            }
          }
        }
        const unverified = candidates.find(
          (candidate) => !record.identities.has(candidate.pid),
        );
        if (unverified)
          record.error ??= `Could not verify lineage for process ${unverified.pid} in the owned group`;
      } catch (error) {
        record.error ??= error instanceof Error ? error.message : String(error);
      }
    };
    observe();
    if (ops.pollIntervalMs > 0) {
      record.timer = setInterval(observe, ops.pollIntervalMs);
      record.timer.unref();
      child.once("exit", () => clearInterval(record.timer));
      child.once("close", () => clearInterval(record.timer));
    }
  };

  /** @param {ProcessIdentity} identity @param {NodeJS.Signals} signal */
  const signalVerified = (identity, signal) => {
    let current;
    try {
      current = ops.readProcess(identity.pid);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    if (!current) return null;
    if (!sameIdentity(identity, current))
      return `Process ${identity.pid} identity changed; refusing to signal`;
    if (current.state === "Z") return null;
    try {
      ops.signal(identity.pid, signal);
      return null;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ESRCH")
        return null;
      return error instanceof Error ? error.message : String(error);
    }
  };

  /** @param {ProcessIdentity[]} identities @param {number} timeoutMs */
  const waitForExit = async (identities, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      let allExited = true;
      for (const identity of identities) {
        try {
          const current = ops.readProcess(identity.pid);
          if (!current) continue;
          if (!sameIdentity(identity, current))
            return `Process ${identity.pid} identity changed during cleanup`;
          if (current.state === "Z") continue;
          allExited = false;
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      }
      if (allExited) return null;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return "Owned processes remained after the cleanup grace period";
  };

  /** @param {Set<ChildProcess>} children @returns {Promise<{ ok: true } | { ok: false, error: string }>} */
  const cleanup = async (children) => {
    const errors = [];
    const completed = [];
    for (const child of children) {
      const record = records.get(child);
      if (!record) {
        errors.push(
          `No verified ownership record for child ${child.pid ?? "unknown"}`,
        );
        continue;
      }
      const childErrors = [];
      if (record.timer) clearInterval(record.timer);
      const identities = [...record.identities.values()];
      if (record.error)
        childErrors.push(
          `Ownership tracking incomplete for child ${record.rootPid}: ${record.error}`,
        );
      if (identities.length === 0)
        childErrors.push(
          `No verified process identity for child ${record.rootPid}`,
        );
      for (const identity of identities) {
        const error = signalVerified(identity, "SIGTERM");
        if (error) childErrors.push(error);
      }
      const termError = await waitForExit(identities, ops.graceMs);
      if (termError) {
        for (const identity of identities) {
          const error = signalVerified(identity, "SIGKILL");
          if (error) childErrors.push(error);
        }
        const killError = await waitForExit(identities, ops.graceMs);
        if (killError) childErrors.push(killError);
      }
      let remains = false;
      for (const identity of identities) {
        try {
          const current = ops.readProcess(identity.pid);
          if (current && !sameIdentity(identity, current)) {
            remains = true;
            childErrors.push(
              `Process ${identity.pid} identity changed; ownership retained`,
            );
          } else if (current && current.state !== "Z") {
            remains = true;
          }
        } catch (error) {
          remains = true;
          childErrors.push(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
      if (
        !remains &&
        !record.error &&
        identities.length > 0 &&
        childErrors.length === 0
      ) {
        completed.push(child);
      } else {
        childErrors.push(
          `Owned child ${child.pid ?? "unknown"} did not complete verified cleanup`,
        );
      }
      errors.push(...childErrors);
    }
    for (const child of completed) {
      records.delete(child);
      children.delete(child);
    }
    return errors.length
      ? { ok: false, error: errors.join("; ") }
      : { ok: true };
  };

  return { track, cleanup };
}
