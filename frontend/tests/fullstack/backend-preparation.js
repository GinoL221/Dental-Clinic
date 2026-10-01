import { spawn } from "node:child_process";
import net from "node:net";
import http from "node:http";

/** @typedef {{ ok: true, artifactPath: string } | { ok: false, stage: 'timeout'|'spawn-error'|'exit', code?: number, error?: string }} PreparationResult */

/** @param {number} port @param {string} [host='127.0.0.1'] */
export const isPortFree = (port, host = "127.0.0.1") =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(true));
  });

/** @param {number[]} ports */
export async function checkPortsFree(ports) {
  const occupied = [];
  for (const port of ports) if (!(await isPortFree(port))) occupied.push(port);
  return { ok: occupied.length === 0, occupied };
}

/** @param {string} url */
const probe = (url) =>
  new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });

/** @param {number} ms */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {string[]} urls @param {{ timeoutMs: number, intervalMs: number }} options */
export async function waitForReady(urls, { timeoutMs, intervalMs }) {
  const deadline = Date.now() + timeoutMs;
  do {
    if ((await Promise.all(urls.map(probe))).every(Boolean)) return true;
    await sleep(intervalMs);
  } while (Date.now() < deadline);
  return false;
}
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

/** @param {number} pid @param {NodeJS.Signals} signal */
function signalProcessGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ESRCH"
    )
      throw error;
  }
}

/** @param {number} processGroupId */
function processGroupAlive(processGroupId) {
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH")
      return false;
    if (error instanceof Error && "code" in error && error.code === "EPERM")
      return true;
    throw error;
  }
}

/** @param {number} processGroupId @param {number} timeoutMs @param {(pid: number) => boolean} isAlive */
async function waitForProcessGroupExit(processGroupId, timeoutMs, isAlive) {
  const deadline = Date.now() + timeoutMs;
  while (isAlive(processGroupId) && Date.now() < deadline) await sleep(20);
  return !isAlive(processGroupId);
}

/** @typedef {{ ok: true } | { ok: false, error: string }} ProcessCleanupResult */
/**
 * Stop a service's owned detached process group even when its direct leader
 * already exited. Only negative-PGID signaling is used for descendants.
 * @param {ChildProcess} child
 * @param {{ signalGroup?: typeof signalProcessGroup, isGroupAlive?: typeof processGroupAlive, graceMs?: number }} [options]
 * @returns {Promise<ProcessCleanupResult>}
 */
export async function cleanupOwnedProcess(
  child,
  {
    signalGroup = signalProcessGroup,
    isGroupAlive = processGroupAlive,
    graceMs = 2000,
  } = {},
) {
  if (!child) return { ok: true };
  const processGroupId =
    /** @type {ChildProcess & { e2eOwnedProcessGroupId?: number }} */ (child)
      .e2eOwnedProcessGroupId;
  if (processGroupId !== undefined) {
    if (child.exitCode === null && child.signalCode === null && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    try {
      signalGroup(processGroupId, "SIGTERM");
      if (
        !(await waitForProcessGroupExit(processGroupId, graceMs, isGroupAlive))
      ) {
        signalGroup(processGroupId, "SIGKILL");
      }
      return (await waitForProcessGroupExit(
        processGroupId,
        graceMs,
        isGroupAlive,
      ))
        ? { ok: true }
        : {
            ok: false,
            error: `Process group ${processGroupId} remained after SIGKILL`,
          };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  if (child.exitCode !== null || child.signalCode !== null || child.killed)
    return { ok: true };
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // Child may have exited after the escalation timer was scheduled.
      }
    }, graceMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve({ ok: true });
    });
    try {
      child.kill("SIGTERM");
    } catch (error) {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/** @param {ChildProcess[]} children @param {Parameters<typeof cleanupOwnedProcess>[1]} [options] */
export async function cleanupAll(children, options) {
  const errors = [];
  for (const child of children) {
    const result = await cleanupOwnedProcess(child, options);
    if (!result.ok) errors.push(result.error);
  }
  return errors.length ? { ok: false, error: errors.join("; ") } : { ok: true };
}

/** @param {ChildProcess} child */
export function markOwnedProcessGroup(
  /** @type {ChildProcess & { e2eOwnedProcessGroupId?: number }} */ child,
) {
  if (child.pid !== undefined) child.e2eOwnedProcessGroupId = child.pid;
  return child;
}

/**
 * Run the bounded Maven preparation separately from service readiness. The
 * detached group lets timeout cleanup reach Maven's JVM child without broad pkill.
 * @param {{ command: string, args: string[], cwd: string, artifactPath: string, timeoutMs: number, killGraceMs?: number, spawnProcess?: typeof spawn, signalGroup?: typeof signalProcessGroup }} options
 * @returns {Promise<PreparationResult>}
 */
export async function prepareBackend({
  command,
  args,
  cwd,
  artifactPath,
  timeoutMs,
  killGraceMs = 2000,
  spawnProcess = spawn,
  signalGroup = signalProcessGroup,
}) {
  let child;
  try {
    child = spawnProcess(command, args, {
      cwd,
      stdio: "inherit",
      detached: true,
    });
  } catch (error) {
    return {
      ok: false,
      stage: "spawn-error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  /** @type {ChildProcess} */
  const processChild = child;
  const outcome = await new Promise((resolve) => {
    let settled = false;
    const finish = (
      /** @type {{ stage: string, code?: number, error?: string }} */ result,
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ stage: "timeout" }), timeoutMs);
    processChild.once("error", (error) =>
      finish({ stage: "spawn-error", error: error.message }),
    );
    processChild.once("exit", (code) =>
      finish({ stage: "exit", code: code === null ? 1 : code }),
    );
  });

  if (outcome.stage === "exit" && outcome.code === 0)
    return { ok: true, artifactPath };
  if (outcome.stage === "timeout") {
    const pid = processChild.pid;
    if (pid !== undefined) {
      try {
        signalGroup(pid, "SIGTERM");
      } catch {
        // The process may have exited between timeout and the group signal.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, killGraceMs));
    if (pid !== undefined) {
      try {
        signalGroup(pid, "SIGKILL");
      } catch {
        // The complete owned process group is already gone.
      }
    }
    if (
      !processChild.killed &&
      !processChild.signalCode &&
      processChild.exitCode === null
    ) {
      try {
        processChild.kill("SIGTERM");
      } catch {
        // Group signaling above remains the primary cleanup path.
      }
    }
    return { ok: false, stage: "timeout" };
  }
  return outcome.stage === "spawn-error"
    ? { ok: false, stage: "spawn-error", error: outcome.error }
    : { ok: false, stage: "exit", code: outcome.code };
}
