// Strict-TDD RED/GREEN evidence for the full-stack process runner, one test
// per boundary (tasks 2.1-2.6). node:test, not Playwright's runner: these are
// process/port orchestration boundaries — except 2.5, which deliberately
// runs a real Playwright process to prove genuine exit code propagation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFullstack } from './run-fullstack.js';
import {
  REQUIRED_ENV_VARS,
  validEnv,
  envWithout,
  spawnFakeService,
  occupyPort,
  releasePort,
  isPortFree,
} from './fixtures/process-runner-fixtures.js';
import { pickBookableTime } from './fixtures/e2e.js';

/** @typedef {import('./run-fullstack.js').RunnerOptions} RunnerOptions */
/** @typedef {Partial<RunnerOptions>} ScenarioOverrides */

const fullstackDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(fullstackDir, '../..');
/** @param {string} label @returns {() => never} */
const neverCalled = (label) => () => {
  throw new Error(`must not ${label}`);
};
/**
 * @param {number} backendPort
 * @param {number} frontendPort
 * @param {ScenarioOverrides} [overrides={}]
 * @returns {RunnerOptions}
 */
const scenario = (backendPort, frontendPort, overrides = {}) => ({
  env: validEnv(),
  ports: { backend: backendPort, frontend: frontendPort },
  readinessUrls: [`http://127.0.0.1:${backendPort}/`, `http://127.0.0.1:${frontendPort}/`],
  timeoutMs: 5000,
  intervalMs: 50,
  spawnBackend: neverCalled('spawn backend'),
  spawnFrontend: neverCalled('spawn frontend'),
  spawnTest: neverCalled('run tests'),
  log: () => {},
  ...overrides,
});

test('2.1 omitted credentials abort preflight before any child/browser launch, names only', async () => {
  /** @type {string[]} */
  const logs = [];
  const result = await runFullstack(
    scenario(9280, 9281, {
      env: envWithout('JWT_SECRET', 'E2E_ADMIN_PASSWORD'),
      spawnBackend: neverCalled('spawn backend'),
      spawnFrontend: neverCalled('spawn frontend'),
      spawnTest: neverCalled('launch a browser'),
      log: (/** @type {string} */ m) => logs.push(m),
    }),
  );
  assert.equal(result.stage, 'preflight-env');
  assert.notEqual(result.exitCode, 0);
  assert.ok(result.missing);
  assert.deepEqual(result.missing.slice().sort(), ['E2E_ADMIN_PASSWORD', 'JWT_SECRET']);
  const combined = logs.join('\n');
  assert.match(combined, /JWT_SECRET/);
  assert.match(combined, /E2E_ADMIN_PASSWORD/);
  for (const [name, value] of Object.entries(validEnv())) {
    if (REQUIRED_ENV_VARS.includes(name) && value !== undefined) {
      assert.doesNotMatch(combined, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('2.2 unready/500 services bound the wait, exit nonzero, clean up, never run tests', async () => {
  const backend = spawnFakeService({ port: 9282, statusCode: 500 });
  const frontend = spawnFakeService({ port: 9283, neverReady: true });
  let testCalls = 0;
  const result = await runFullstack(
    scenario(9282, 9283, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => {
        testCalls += 1;
        throw new Error('must not run tests');
      },
      timeoutMs: 400,
    }),
  );
  assert.equal(result.stage, 'readiness-timeout');
  assert.notEqual(result.exitCode, 0);
  assert.equal(testCalls, 0);
  assert.equal(result.cleanupOk, true);
  assert.equal(await isPortFree(9282), true);
});

test('2.3 backend child exiting 17 propagates that status and blocks browser execution', async () => {
  const backend = spawnFakeService({ port: 9284, neverReady: true, exitCode: 17, exitAfterMs: 30 });
  const frontend = spawnFakeService({ port: 9285, statusCode: 200 });
  let testCalls = 0;
  const result = await runFullstack(
    scenario(9284, 9285, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => {
        testCalls += 1;
        throw new Error('must not run tests');
      },
    }),
  );
  assert.equal(result.exitCode, 17);
  assert.equal(result.stage, 'child-exit');
  assert.equal(testCalls, 0);
});

test('2.4 occupied 8080/4173 are refused instead of reused (reuseExistingServer:false)', async () => {
  const backendGuard = await occupyPort(8080);
  const frontendGuard = await occupyPort(4173);
  let calls = 0;
  try {
    const result = await runFullstack(
      scenario(8080, 4173, {
        spawnBackend: () => {
          calls += 1;
          throw new Error('must not attach');
        },
        spawnFrontend: () => {
          calls += 1;
          throw new Error('must not attach');
        },
        spawnTest: neverCalled('run tests'),
      }),
    );
    assert.equal(result.stage, 'preflight-ports');
    assert.notEqual(result.exitCode, 0);
    assert.equal(calls, 0);
    assert.ok(result.occupied);
    assert.deepEqual(
      result.occupied.slice().sort((a, b) => a - b),
      [4173, 8080],
    );
  } finally {
    await releasePort(backendGuard);
    await releasePort(frontendGuard);
  }
});

// A real Playwright process, not a fake exit code, to prove genuine
// propagation of a browser-run test failure (distinct from 2.2/2.3/2.4/2.6).
test('2.5 a forced failing spec produces diagnostics and a real nonzero Playwright/CI exit status', async (t) => {
  const backend = spawnFakeService({ port: 9286, statusCode: 200 });
  const frontend = spawnFakeService({ port: 9287, statusCode: 200 });
  const specName = `tmp-forced-failure-${process.pid}.spec.js`;
  const specPath = path.join(fullstackDir, specName);
  fs.writeFileSync(
    specPath,
    "import { test, expect } from '@playwright/test';\n" +
      "test('forced failure', () => { expect(1).toBe(2); });\n",
  );
  t.after(() => fs.rmSync(specPath, { force: true }));

  let stdout = '';
  const result = await runFullstack(
    scenario(9286, 9287, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => {
        const child = spawn(
          'npx',
          // --no-deps: this test proves the runner propagates a real
          // Playwright failure using fake backend/frontend services, not the
          // real app — the fullstack-chromium project's `setup` dependency
          // (added for booking/authorization's real-UI-login sessions) would
          // otherwise try to log in against these fakes and fail for an
          // unrelated reason.
          ['playwright', 'test', specName, '--config=playwright.fullstack.config.js', '--no-deps'],
          {
            cwd: frontendRoot,
            stdio: 'pipe',
          },
        );
        child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
        return child;
      },
    }),
  );
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.stage, 'completed');
  assert.match(stdout, /forced failure/);
});

test('2.6 forced success/timeout/browser-failure all clean up; a cleanup failure never masks the exit code', async () => {
  // Success: exit 0, children stopped, ports released.
  let backend = spawnFakeService({ port: 9288, statusCode: 200 });
  let frontend = spawnFakeService({ port: 9289, statusCode: 200 });
  let result = await runFullstack(
    scenario(9288, 9289, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => spawn(process.execPath, ['-e', 'process.exit(0)']),
    }),
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.cleanupOk, true);
  assert.equal(await isPortFree(9288), true);

  // Browser failure: real exit code (9) propagates, children still cleaned up.
  backend = spawnFakeService({ port: 9292, statusCode: 200 });
  frontend = spawnFakeService({ port: 9293, statusCode: 200 });
  result = await runFullstack(
    scenario(9292, 9293, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => spawn(process.execPath, ['-e', 'process.exit(9)']),
    }),
  );
  assert.equal(result.exitCode, 9);
  assert.equal(result.cleanupOk, true);

  // Timeout: never becomes ready, still cleans up and releases ports.
  backend = spawnFakeService({ port: 9290, neverReady: true });
  frontend = spawnFakeService({ port: 9291, neverReady: true });
  result = await runFullstack(
    scenario(9290, 9291, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: neverCalled('run tests'),
      timeoutMs: 300,
    }),
  );
  assert.equal(result.stage, 'readiness-timeout');
  assert.equal(result.cleanupOk, true);
  assert.equal(await isPortFree(9290), true);

  // A cleanup failure is handled safely and never masks the real exit code.
  backend = spawnFakeService({ port: 9294, statusCode: 200 });
  frontend = spawnFakeService({ port: 9295, statusCode: 200 });
  backend.kill = () => {
    throw new Error('simulated cleanup failure');
  };
  result = await runFullstack(
    scenario(9294, 9295, {
      spawnBackend: () => backend,
      spawnFrontend: () => frontend,
      spawnTest: () => spawn(process.execPath, ['-e', 'process.exit(0)']),
    }),
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.cleanupOk, false);
  const cleanupFailureBackendPid = backend.pid;
  if (cleanupFailureBackendPid !== undefined) {
    try {
      process.kill(cleanupFailureBackendPid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }
  frontend.kill();
});

// Correction fix 1 (BLOCKER): spawn() emits 'error' asynchronously (e.g.
// ENOENT); with no listener anywhere, Node throws it as uncaught and crashes
// the whole runner, bypassing cleanupAll entirely.
test('runner-fix-1 a spawn error (ENOENT) is caught, cleaned up, and exits nonzero instead of crashing', async () => {
  const frontend = spawnFakeService({ port: 9296, statusCode: 200 });
  let testCalls = 0;
  const result = await runFullstack(
    scenario(9297, 9296, {
      spawnBackend: () => spawn('this-binary-definitely-does-not-exist-e2e-xyz', []),
      spawnFrontend: () => frontend,
      spawnTest: () => {
        testCalls += 1;
        throw new Error('must not run tests');
      },
      timeoutMs: 3000,
    }),
  );
  assert.notEqual(result.exitCode, 0);
  assert.equal(testCalls, 0);
  assert.equal(result.cleanupOk, true);
  assert.equal(await isPortFree(9296), true);
});

// Correction fix 2 (CRITICAL, found independently by two review lenses): a
// child terminated by a real external signal has exitCode:null and
// signalCode set instead — the early-exit race only checked exitCode, so it
// silently proceeded to spawnTest(), and killChild's "already dead" guard
// (also exitCode-only) re-attached a fresh 'exit' listener that never fires
// again, hanging cleanup. process.kill(pid, ...) (not child.kill()) leaves
// `killed` false, faithfully reproducing an externally-signaled process.
test(
  'runner-fix-2 a required service killed by a real signal is an early exit; cleanup does not hang',
  { timeout: 3000 },
  async () => {
    const backend = spawnFakeService({ port: 9298, neverReady: true });
    const frontend = spawnFakeService({ port: 9299, neverReady: true });
    setTimeout(() => {
      const backendPid = backend.pid;
      if (backendPid !== undefined) {
        try {
          process.kill(backendPid, 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    }, 50);
    let testCalls = 0;
    const started = Date.now();
    const result = await runFullstack(
      scenario(9298, 9299, {
        spawnBackend: () => backend,
        spawnFrontend: () => frontend,
        spawnTest: () => {
          testCalls += 1;
          return spawn(process.execPath, ['-e', 'process.exit(0)']);
        },
        timeoutMs: 5000,
      }),
    );
    assert.equal(testCalls, 0);
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.cleanupOk, true);
    assert.ok(Date.now() - started < 2500, 'cleanup must not hang past the signal-kill race');
  },
);

// Correction fix 3: the early-exit branch (spawn-error/child-exit) awaited
// cleanupAll(children) but discarded its result, hardcoding cleanupOk:true —
// a genuine cleanup failure alongside an early exit was silently hidden.
test('runner-fix-3 a cleanup failure during an early child-exit is reported, not hardcoded true', async () => {
  const backend = spawnFakeService({ port: 9300, neverReady: true, exitCode: 17, exitAfterMs: 30 });
  const frontend = spawnFakeService({ port: 9301, statusCode: 200 });
  frontend.kill = () => {
    throw new Error('simulated cleanup failure');
  };
  try {
    const result = await runFullstack(
      scenario(9300, 9301, {
        spawnBackend: () => backend,
        spawnFrontend: () => frontend,
        spawnTest: neverCalled('run tests'),
      }),
    );
    assert.equal(result.stage, 'child-exit');
    assert.equal(result.exitCode, 17);
    assert.equal(result.cleanupOk, false);
  } finally {
    const frontendPid = frontend.pid;
    if (frontendPid !== undefined) {
      try {
        process.kill(frontendPid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
});

// Correction: pickBookableTime() must be genuinely collision-resistant, not
// merely a wall-clock-derived bucket (which is deterministic per second, so
// nearby-in-time calls — the exact pattern that already caused a real RED
// failure with a fixed '15:30' — correlate instead of being independent).
test('pickBookableTime always returns a valid, non-seeded-conflicting slot', () => {
  for (let i = 0; i < 50; i++) {
    const time = pickBookableTime();
    assert.match(time, /^\d{2}:\d{2}$/);
    assert.ok(time >= '08:30' && time <= '17:59', `${time} must be within 08:30-17:59`);
    assert.notEqual(time, '10:00', 'must never collide with the seeded appointment slot');
  }
});

test('pickBookableTime is not deterministically tied to call timing (decorrelated)', () => {
  const samples = new Set();
  for (let i = 0; i < 30; i++) samples.add(pickBookableTime());
  // 30 calls landing on a single identical value has probability ~(1/540)^29
  // under genuine randomness — this only happens if calls are correlated
  // (e.g. still derived from a slow-moving wall-clock bucket).
  assert.ok(samples.size > 1, 'repeated calls must not all collapse to one value');
});
