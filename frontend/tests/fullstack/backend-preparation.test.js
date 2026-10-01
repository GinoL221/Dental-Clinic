import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { prepareBackend } from "./backend-preparation.js";
import { runFullstack } from "./run-fullstack.js";

/** @returns {any} */
function fakeChild(pid = 1234) {
  /** @type {any} */
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = null;
  child.signalCode = null;
  child.killed = false;
  child.kill = (/** @type {string} */ signal) => {
    child.killed = true;
    if (signal === "SIGTERM") {
      child.exitCode = 143;
      queueMicrotask(() => child.emit("exit", 143, null));
    }
    return true;
  };
  return child;
}

/** @param {any} [overrides] @returns {any} */
const options = (overrides = {}) => ({
  command: "mvn",
  args: ["package"],
  cwd: ".",
  artifactPath: "target/app.jar",
  timeoutMs: 100,
  spawnProcess: () => fakeChild(),
  signalGroup: () => {},
  ...overrides,
});

test("returns the artifact only after successful preparation in an isolated process group", async () => {
  const child = fakeChild();
  /** @type {any} */
  let spawnOptions;
  const resultPromise = prepareBackend(
    options({
      spawnProcess: (
        /** @type {string} */ _command,
        /** @type {string[]} */ _args,
        /** @type {any} */ opts,
      ) => {
        spawnOptions = opts;
        queueMicrotask(() => child.emit("exit", 0, null));
        return child;
      },
    }),
  );
  assert.deepEqual(await resultPromise, {
    ok: true,
    artifactPath: "target/app.jar",
  });
  assert.equal(spawnOptions?.detached, true);
});

test("reports preparation failure and early exit without exposing the artifact", async () => {
  const child = fakeChild();
  const result = prepareBackend(
    options({
      spawnProcess: () => {
        queueMicrotask(() => child.emit("exit", 17, null));
        return child;
      },
    }),
  );
  assert.deepEqual(await result, { ok: false, stage: "exit", code: 17 });
});

test("reports spawn failure", async () => {
  const child = fakeChild();
  const result = prepareBackend(
    options({
      command: "missing-mvn",
      spawnProcess: () => {
        queueMicrotask(() => child.emit("error", new Error("missing")));
        return child;
      },
    }),
  );
  assert.deepEqual(await result, {
    ok: false,
    stage: "spawn-error",
    error: "missing",
  });
});

test("preparation failure cleans the early frontend and blocks backend/browser launch", async () => {
  const frontend = fakeChild(2222);
  let backendCalls = 0;
  let browserCalls = 0;
  const result = await runFullstack({
    env: {
      JWT_SECRET: "x",
      E2E_ADMIN_EMAIL: "a",
      E2E_ADMIN_PASSWORD: "b",
      E2E_NON_ADMIN_EMAIL: "c",
      E2E_NON_ADMIN_PASSWORD: "d",
    },
    ports: { backend: 0, frontend: 0 },
    readinessUrls: [],
    prepareBackend: async () => ({ ok: false, stage: "timeout" }),
    spawnBackend: () => {
      backendCalls += 1;
      throw new Error("backend must not launch");
    },
    spawnFrontend: () => frontend,
    spawnTest: () => {
      browserCalls += 1;
      throw new Error("browser must not launch");
    },
  });
  assert.equal(result.stage, "backend-preparation");
  assert.equal(frontend.killed, true);
  assert.equal(backendCalls, 0);
  assert.equal(browserCalls, 0);
});

test("starts frontend while Maven preparation is pending, but defers backend and browser", async () => {
  /** @type {(result: any) => void} */
  let resolvePreparation = () => {};
  const preparation = new Promise((resolve) => {
    resolvePreparation = resolve;
  });
  const frontend = fakeChild(3333);
  const backend = fakeChild(4444);
  const browser = fakeChild(5555);
  let frontendCalls = 0;
  let backendCalls = 0;
  let browserCalls = 0;
  const runPromise = runFullstack({
    env: {
      JWT_SECRET: "x",
      E2E_ADMIN_EMAIL: "a",
      E2E_ADMIN_PASSWORD: "b",
      E2E_NON_ADMIN_EMAIL: "c",
      E2E_NON_ADMIN_PASSWORD: "d",
    },
    ports: { backend: 0, frontend: 0 },
    readinessUrls: [],
    prepareBackend: () => preparation,
    spawnBackend: () => {
      backendCalls += 1;
      return backend;
    },
    spawnFrontend: () => {
      frontendCalls += 1;
      return frontend;
    },
    spawnTest: () => {
      browserCalls += 1;
      setTimeout(() => browser.emit("exit", 0), 10);
      return browser;
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  const frontendStartedDuringPreparation = frontendCalls === 1;
  assert.equal(backendCalls, 0);
  assert.equal(browserCalls, 0);
  resolvePreparation({ ok: true, artifactPath: "target/app.jar" });
  const result = await runPromise;
  assert.equal(result.stage, "completed");
  assert.equal(frontendStartedDuringPreparation, true);
});

test("runner signals the owned group after the leader exits, until descendants are gone", async () => {
  const groups = new Set([3456, 4567]);
  /** @type {Array<[number, string]>} */
  const signals = [];
  const exitedLeader = (/** @type {number} */ pid) => {
    /** @type {any} */
    const leader = new EventEmitter();
    Object.assign(leader, {
      pid,
      exitCode: 0,
      signalCode: null,
      killed: true,
      e2eOwnedProcessGroupId: pid,
    });
    return leader;
  };
  const backend = exitedLeader(3456);
  const frontend = exitedLeader(4567);
  /** @type {any} */
  const testChild = new EventEmitter();
  /** @type {any} */
  const runnerOptions = {
    env: {
      JWT_SECRET: "x",
      E2E_ADMIN_EMAIL: "a",
      E2E_ADMIN_PASSWORD: "b",
      E2E_NON_ADMIN_EMAIL: "c",
      E2E_NON_ADMIN_PASSWORD: "d",
    },
    ports: { backend: 0, frontend: 0 },
    readinessUrls: [],
    spawnBackend: () => backend,
    spawnFrontend: () => frontend,
    spawnTest: () => {
      setTimeout(() => testChild.emit("exit", 0), 20);
      return testChild;
    },
    signalGroup: (/** @type {number} */ pid, /** @type {string} */ signal) => {
      signals.push([pid, signal]);
      if (signal === "SIGKILL") groups.delete(pid);
    },
    isGroupAlive: (/** @type {number} */ pid) => groups.has(pid),
    groupKillGraceMs: 1,
  };
  const result = await runFullstack(runnerOptions);
  assert.equal(result.stage, "completed");
  assert.deepEqual(signals, [
    [4567, "SIGTERM"],
    [4567, "SIGKILL"],
    [3456, "SIGTERM"],
    [3456, "SIGKILL"],
  ]);
  assert.equal(groups.size, 0);
});

test("timeout kills the owned process group even if its leader already exited", async () => {
  const child = fakeChild(2345);
  child.exitCode = 143;
  child.killed = true;
  /** @type {string[]} */
  const signals = [];
  const result = await prepareBackend(
    options({
      timeoutMs: 1,
      killGraceMs: 1,
      spawnProcess: () => child,
      signalGroup: (/** @type {number} */ _pid, /** @type {string} */ signal) =>
        signals.push(signal),
    }),
  );
  assert.deepEqual(result, { ok: false, stage: "timeout" });
  assert.deepEqual(signals, ["SIGTERM", "SIGKILL"]);
});
