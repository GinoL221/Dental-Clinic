// Regression coverage for owned fake-service teardown.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { createOwnedTestProcessTracker } from "./fixtures/owned-test-processes.js";

/** @param {number} pid */
const fakeChild = (pid) =>
  /** @type {import('node:child_process').ChildProcess} */ (
    Object.assign(new EventEmitter(), {
      pid,
      exitCode: null,
      signalCode: null,
      killed: false,
    })
  );
/** @param {number} pid @param {number} ppid @param {number} pgid @param {string} startTime @param {string} [state='S'] @returns {ProcessIdentity} */
const identity = (pid, ppid, pgid, startTime, state = "S") => ({
  pid,
  ppid,
  pgid,
  startTime,
  state,
});
/** @param {number} delay */
const pause = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
import {
  lazyFakeService,
  stopOwnedServices,
} from "./fixtures/process-runner-lifecycle.js";

/** @typedef {{ pid: number, ppid: number, pgid: number, startTime: string, state: string }} ProcessIdentity */
/** @param {number} pid @returns {ProcessIdentity} */
const processIdentity = (pid) => {
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
};

/** @param {ProcessIdentity} identity */
const isAlive = (identity) => {
  try {
    const current = processIdentity(identity.pid);
    return (
      current.startTime === identity.startTime &&
      current.pgid === identity.pgid &&
      current.state !== "Z"
    );
  } catch {
    return false;
  }
};

/** @param {ProcessIdentity} identity @param {NodeJS.Signals} signal */
const signalVerified = (identity, signal) => {
  try {
    const current = processIdentity(identity.pid);
    if (
      current.startTime !== identity.startTime ||
      current.pgid !== identity.pgid
    )
      return false;
    process.kill(identity.pid, signal);
    return true;
  } catch {
    return false;
  }
};

test("teardown retains ownership and stops a descendant after its leader exits", async () => {
  let output = "";
  /** @type {{ value: ProcessIdentity | null }} */
  const descendant = { value: null };
  const owned = new Set();
  const spawnService = lazyFakeService(owned);
  const leader = spawnService({
    port: 9302,
    neverReady: true,
    spawnDescendant: true,
  });
  assert.ok(leader.stdout, "fixture stdout must be piped");
  leader.stdout.on("data", (chunk) => {
    output += chunk.toString();
    const pid = Number(output.trim());
    if (Number.isInteger(pid) && pid > 0 && !descendant.value)
      descendant.value = processIdentity(pid);
  });
  try {
    await new Promise((resolve, reject) => {
      leader.once("error", reject);
      leader.once("close", resolve);
    });
    assert.ok(descendant.value, "fixture descendant identity must be observed");
    assert.equal(
      descendant.value.pgid,
      leader.pid,
      "descendant stays in its leader's group",
    );
    const registry = process.env.OWNED_TEST_PROCESSES_FILE;
    if (registry)
      fs.writeFileSync(registry, JSON.stringify([descendant.value]));

    await stopOwnedServices(owned);
    assert.ok(
      !isAlive(descendant.value),
      "owned descendant must be gone or a zombie",
    );
  } finally {
    if (descendant.value) {
      signalVerified(descendant.value, "SIGTERM");
      const deadline = Date.now() + 1000;
      while (Date.now() < deadline && isAlive(descendant.value)) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (isAlive(descendant.value))
        signalVerified(descendant.value, "SIGKILL");
    }
  }
});

test("cleanup follows multiple descendant levels after the leader exits", async () => {
  const processes = new Map([
    [401, identity(401, 1, 401, "root")],
    [402, identity(402, 401, 401, "child")],
    [403, identity(403, 402, 401, "grandchild")],
  ]);
  /** @type {[number, NodeJS.Signals][]} */
  const signals = [];
  const tracker = createOwnedTestProcessTracker({
    readProcess: (pid) => processes.get(pid) ?? null,
    listProcesses: () => [...processes.keys()],
    signal: (pid, signal) => {
      signals.push([pid, signal]);
      const current = processes.get(pid);
      if (current) processes.set(pid, { ...current, state: "Z" });
    },
    pollIntervalMs: 0,
    graceMs: 1,
  });
  const child = fakeChild(401);
  const owned = new Set([child]);
  tracker.track(child);
  processes.set(401, { ...identity(401, 1, 401, "root"), state: "Z" });
  const result = await tracker.cleanup(owned);
  assert.equal(result.ok, true);
  assert.deepEqual(signals, [
    [402, "SIGTERM"],
    [403, "SIGTERM"],
  ]);
  assert.equal(owned.size, 0);
});

test("cleanup refuses to signal when a tracked PID has a different start time", async () => {
  const processes = new Map([
    [101, identity(101, 1, 101, "root")],
    [102, identity(102, 101, 101, "child")],
  ]);
  /** @type {[number, NodeJS.Signals][]} */
  const signals = [];
  const tracker = createOwnedTestProcessTracker({
    readProcess: (pid) => processes.get(pid) ?? null,
    listProcesses: () => [...processes.keys()],
    signal: (pid, signal) => {
      signals.push([pid, signal]);
      if (pid === 101)
        processes.set(101, { ...identity(101, 1, 101, "root"), state: "Z" });
    },
    pollIntervalMs: 0,
    graceMs: 1,
  });
  const child = fakeChild(101);
  const owned = new Set([child]);
  tracker.track(child);
  processes.set(102, identity(102, 101, 101, "reused"));
  const result = await tracker.cleanup(owned);
  assert.equal(result.ok, false);
  assert.deepEqual(signals, [[101, "SIGTERM"]]);
  assert.equal(owned.has(child), true);
});

test("cleanup retains ownership when a reused PID is now a zombie", async () => {
  const processes = new Map([
    [151, identity(151, 1, 151, "root")],
    [152, identity(152, 151, 151, "owned-start")],
  ]);
  /** @type {[number, NodeJS.Signals][]} */
  const signals = [];
  const tracker = createOwnedTestProcessTracker({
    readProcess: (pid) => processes.get(pid) ?? null,
    listProcesses: () => [...processes.keys()],
    signal: (pid, signal) => signals.push([pid, signal]),
    pollIntervalMs: 0,
    graceMs: 1,
  });
  const child = fakeChild(151);
  const owned = new Set([child]);
  tracker.track(child);
  processes.set(151, { ...identity(151, 1, 151, "root"), state: "Z" });
  processes.set(152, identity(152, 151, 151, "reused-start", "Z"));

  const result = await tracker.cleanup(owned);

  assert.equal(result.ok, false);
  assert.deepEqual(signals, []);
  assert.equal(owned.has(child), true);
});

test("cleanup fails closed when process identity becomes unavailable", async () => {
  const processes = new Map([
    [201, identity(201, 1, 201, "root")],
    [202, identity(202, 201, 201, "child")],
  ]);
  /** @type {[number, NodeJS.Signals][]} */
  const signals = [];
  const tracker = createOwnedTestProcessTracker({
    readProcess: (pid) => {
      if (pid === 202 && unavailable) throw new Error("EACCES");
      return processes.get(pid) ?? null;
    },
    listProcesses: () => [...processes.keys()],
    signal: (pid, signal) => {
      signals.push([pid, signal]);
      if (pid === 201)
        processes.set(201, { ...identity(201, 1, 201, "root"), state: "Z" });
    },
    pollIntervalMs: 0,
    graceMs: 1,
  });
  const child = fakeChild(201);
  const owned = new Set([child]);
  let unavailable = false;
  tracker.track(child);
  unavailable = true;
  const result = await tracker.cleanup(owned);
  assert.equal(result.ok, false);
  assert.deepEqual(signals, [[201, "SIGTERM"]]);
  assert.equal(owned.has(child), true);
});

test("cleanup escalates only the verified surviving process and disposes polling on leader exit", async () => {
  const processes = new Map([
    [301, identity(301, 1, 301, "root")],
    [302, identity(302, 301, 301, "child")],
  ]);
  /** @type {[number, NodeJS.Signals][]} */
  const signals = [];
  let scans = 0;
  const tracker = createOwnedTestProcessTracker({
    readProcess: (pid) => processes.get(pid) ?? null,
    listProcesses: () => {
      scans += 1;
      return [...processes.keys()];
    },
    signal: (pid, signal) => {
      signals.push([pid, signal]);
      const current = processes.get(pid);
      if (signal === "SIGKILL" && current)
        processes.set(pid, { ...current, state: "Z" });
    },
    pollIntervalMs: 5,
    graceMs: 20,
  });
  const child = fakeChild(301);
  const owned = new Set([child]);
  tracker.track(child);
  await pause(15);
  const root = processes.get(301);
  assert.ok(root);
  processes.set(301, { ...root, state: "Z" });
  child.emit("exit", 0, null);
  const scansAtExit = scans;
  await pause(20);
  assert.equal(
    scans,
    scansAtExit,
    "leader exit disposes the descendant polling timer",
  );
  const result = await tracker.cleanup(owned);
  assert.equal(result.ok, true);
  assert.deepEqual(signals, [
    [302, "SIGTERM"],
    [302, "SIGKILL"],
  ]);
  assert.equal(owned.size, 0);
});
