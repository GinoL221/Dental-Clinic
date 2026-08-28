#!/usr/bin/env node
// Full-stack process runner (PR2, tasks 2.1-2.7): preflight credentials and
// ports before spawning anything, poll readiness with a bound, propagate a
// child's early exit or the test command's real exit code, and always clean
// up without letting a cleanup failure mask that code.
import { spawn } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

/** @typedef {Record<string, string | undefined>} Environment */
/** @typedef {{ backend: number, frontend: number }} Ports */
/** @typedef {{ timeoutMs: number, intervalMs: number }} ReadinessOptions */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */
/** @typedef {() => ChildProcess} SpawnChild */
/** @typedef {{ env: Environment, ports: Ports, readinessUrls: string[], spawnBackend: SpawnChild, spawnFrontend: SpawnChild, spawnTest: SpawnChild, timeoutMs?: number, intervalMs?: number, log?: (message: string) => void }} RunnerOptions */
/** @typedef {{ code: number | null, signal: NodeJS.Signals | null } | { error: Error }} EarlyExitResult */
/** @typedef {{ code: number | null } | { error: Error }} TestOutcome */
/** @typedef {{ ok: true } | { ok: false, error: string }} CleanupResult */
/** @typedef {{ exitCode: number, stage: 'preflight-env'|'preflight-ports'|'spawn-error'|'child-exit'|'readiness-timeout'|'completed', missing?: string[], occupied?: number[], cleanupOk?: boolean, cleanupError?: string }} RunResult */

export const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_NON_ADMIN_EMAIL',
  'E2E_NON_ADMIN_PASSWORD',
];

/** @param {Environment} env */
export function checkRequiredEnv(env) {
  const missing = REQUIRED_ENV_VARS.filter((name) => !env[name] || String(env[name]).trim() === '');
  return { ok: missing.length === 0, missing };
}

/**
 * @param {number} port
 * @param {string} [host='127.0.0.1']
 * @returns {Promise<boolean>}
 */
const isPortFree = (port, host = '127.0.0.1') =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
  });

/** @param {number[]} ports */
async function checkPortsFree(ports) {
  const occupied = [];
  for (const port of ports) if (!(await isPortFree(port))) occupied.push(port);
  return { ok: occupied.length === 0, occupied };
}

/** @param {string} url */
const probe = (url) =>
  new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });

/** @param {number} ms @returns {Promise<void>} */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {string[]} urls
 * @param {ReadinessOptions} options
 */
async function waitForReady(urls, { timeoutMs, intervalMs }) {
  const deadline = Date.now() + timeoutMs;
  do {
    if ((await Promise.all(urls.map(probe))).every(Boolean)) return true;
    await sleep(intervalMs);
  } while (Date.now() < deadline);
  return false;
}

// True once a child has genuinely stopped running, whether that was a normal
// exit (exitCode set) or termination by signal (signalCode set instead —
// exitCode stays null in that case, which must never be read as "still
// running").
/** @param {ChildProcess} child */
function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

// Never throws: a kill() failure is reported so every child still gets tried.
/** @param {ChildProcess | null | undefined} child */
async function killChild(child) {
  if (!child || hasExited(child) || child.killed) return { ok: true };
  try {
    /** @type {Promise<void>} */
    const exitPromise = new Promise((resolve, reject) => {
      child.once('exit', () => resolve());
      try {
        child.kill('SIGTERM');
      } catch (error) {
        reject(error);
        return;
      }
      setTimeout(() => {
        if (child.exitCode === null) {
          try {
            child.kill('SIGKILL');
          } catch {
            /* already gone */
          }
        }
      }, 2000);
    });
    await exitPromise;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** @param {ChildProcess[]} children */
async function cleanupAll(children) {
  const errors = [];
  for (const child of children) {
    const result = await killChild(child);
    if (!result.ok) errors.push(result.error);
  }
  return errors.length === 0 ? { ok: true } : { ok: false, error: errors.join('; ') };
}

/** @param {RunnerOptions} options @returns {Promise<RunResult>} */
export async function runFullstack({
  env,
  ports,
  readinessUrls,
  spawnBackend,
  spawnFrontend,
  spawnTest,
  timeoutMs = 30000,
  intervalMs = 200,
  log = () => {},
}) {
  const envCheck = checkRequiredEnv(env);
  if (!envCheck.ok) {
    log(`Missing required environment variable(s): ${envCheck.missing.join(', ')}`);
    return { exitCode: 2, stage: 'preflight-env', missing: envCheck.missing };
  }

  const portCheck = await checkPortsFree(Object.values(ports));
  if (!portCheck.ok) {
    log(`Port(s) already in use, refusing to reuse: ${portCheck.occupied.join(', ')}`);
    return { exitCode: 3, stage: 'preflight-ports', occupied: portCheck.occupied };
  }

  const children = [spawnBackend(), spawnFrontend()];
  // Tracks the first of: a normal exit, a signal-terminated exit (exitCode
  // stays null; signal carries the reason instead), or a spawn 'error'
  // (e.g. ENOENT) — every spawned child MUST have an 'error' listener, or
  // Node throws it as uncaught and crashes the whole runner past cleanup.
  /** @type {EarlyExitResult | null} */
  let earlyExitResult = null;
  /** @type {Promise<boolean>} */
  const earlyExitRace = new Promise((resolve) => {
    for (const child of children) {
      /** @param {EarlyExitResult} result */
      const settle = (result) => {
        if (earlyExitResult === null) {
          earlyExitResult = result;
          resolve(true);
        }
      };
      child.once('exit', (code, signal) => settle({ code, signal }));
      child.once('error', (error) => settle({ error }));
    }
  });
  const ready = await Promise.race([
    waitForReady(readinessUrls, { timeoutMs, intervalMs }),
    earlyExitRace,
  ]);

  if (earlyExitResult !== null) {
    const cleanupResult = await cleanupAll(children);
    const earlyExit = /** @type {EarlyExitResult} */ (earlyExitResult);
    if ('error' in earlyExit) {
      log(`A required service failed to start: ${earlyExit.error.message}`);
      return { exitCode: 5, stage: 'spawn-error', cleanupOk: cleanupResult.ok };
    }
    const exitCode = earlyExit.code !== null ? earlyExit.code : 1;
    const signalNote = earlyExit.signal ? ` (signal ${earlyExit.signal})` : '';
    log(`A required service exited with code ${exitCode}${signalNote} before it became ready.`);
    return {
      exitCode: exitCode === 0 ? 1 : exitCode,
      stage: 'child-exit',
      cleanupOk: cleanupResult.ok,
    };
  }
  if (!ready) {
    const cleanupResult = await cleanupAll(children);
    log('Readiness check timed out before services became ready.');
    return { exitCode: 4, stage: 'readiness-timeout', cleanupOk: cleanupResult.ok };
  }

  const testChild = spawnTest();
  /** @type {Promise<TestOutcome>} */
  const testOutcomePromise = new Promise((resolve) => {
    testChild.once('exit', (code) => resolve({ code }));
    testChild.once('error', (error) => resolve({ error }));
  });
  const testOutcome = await testOutcomePromise;
  /** @type {number} */
  let testExitCode;
  if ('error' in testOutcome) {
    testExitCode = 1;
    log(`Test process failed to run: ${testOutcome.error.message}`);
  } else {
    testExitCode = testOutcome.code === null ? 1 : testOutcome.code;
  }

  const cleanupResult = await cleanupAll(children);
  if (!cleanupResult.ok) log(`Cleanup after tests reported an error: ${cleanupResult.error}`);
  const cleanupError = cleanupResult.ok ? undefined : cleanupResult.error;
  return {
    exitCode: testExitCode,
    stage: 'completed',
    cleanupOk: cleanupResult.ok,
    cleanupError,
  };
}

/** @returns {RunnerOptions} */
function buildCliOptions() {
  return {
    env: process.env,
    ports: { backend: 8080, frontend: 4173 },
    readinessUrls: ['http://127.0.0.1:8080/api/v3/api-docs', 'http://127.0.0.1:4173/'],
    timeoutMs: Number(process.env.E2E_READY_TIMEOUT_MS || 60000),
    intervalMs: 500,
    spawnBackend: () =>
      spawn('mvn', ['-f', '../backend/pom.xml', 'spring-boot:run'], {
        env: { ...process.env, SPRING_PROFILES_ACTIVE: 'e2e' },
        stdio: 'inherit',
      }),
    spawnFrontend: () =>
      spawn('sh', ['-c', 'npm run build && npm run preview'], { stdio: 'inherit' }),
    spawnTest: () =>
      spawn('npx', ['playwright', 'test', '--config=playwright.fullstack.config.js'], {
        stdio: 'inherit',
      }),
    log: (message) => console.error(`[e2e-fullstack] ${message}`),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runFullstack(buildCliOptions()).then((result) => {
    process.exitCode = result.exitCode;
  });
}
