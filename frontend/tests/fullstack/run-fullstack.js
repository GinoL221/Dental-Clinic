#!/usr/bin/env node
// Full-stack process runner (PR2, tasks 2.1-2.7): preflight credentials and
// ports before spawning anything, poll readiness with a bound, propagate a
// child's early exit or the test command's real exit code, and always clean
// up without letting a cleanup failure mask that code.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  checkPortsFree,
  waitForReady,
  prepareBackend,
  cleanupAll,
  markOwnedProcessGroup,
} from "./backend-preparation.js";

/** @typedef {Record<string, string | undefined>} Environment */
/** @typedef {{ backend: number, frontend: number }} Ports */
/** @typedef {{ timeoutMs: number, intervalMs: number }} ReadinessOptions */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */
/** @typedef {() => ChildProcess} SpawnChild */
/** @typedef {() => Promise<import('./backend-preparation.js').PreparationResult>} PrepareBackend */
/** @typedef {{ env: Environment, ports: Ports, readinessUrls: string[], spawnBackend: SpawnChild, spawnFrontend: SpawnChild, spawnTest: SpawnChild, prepareBackend?: PrepareBackend, timeoutMs?: number, intervalMs?: number, signalGroup?: (pid: number, signal: NodeJS.Signals) => void, isGroupAlive?: (pid: number) => boolean, groupKillGraceMs?: number, log?: (message: string) => void, processTarget?: NodeJS.EventEmitter }} RunnerOptions */
/** @typedef {{ code: number | null, signal: NodeJS.Signals | null } | { error: Error }} EarlyExitResult */
/** @typedef {{ code: number | null } | { error: Error }} TestOutcome */
/** @typedef {{ ok: true } | { ok: false, error: string }} CleanupResult */
/** @typedef {{ exitCode: number, stage: 'preflight-env'|'preflight-ports'|'backend-preparation'|'spawn-error'|'child-exit'|'readiness-timeout'|'completed'|'signal-terminated', missing?: string[], occupied?: number[], preparation?: string, signal?: NodeJS.Signals, cleanupOk?: boolean, cleanupError?: string }} RunResult */

export const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_NON_ADMIN_EMAIL",
  "E2E_NON_ADMIN_PASSWORD",
];

/** @param {Environment} env */
export function checkRequiredEnv(env) {
  const missing = REQUIRED_ENV_VARS.filter(
    (name) => !env[name] || String(env[name]).trim() === "",
  );
  return { ok: missing.length === 0, missing };
}

/**
 * Resolves the full-stack run's ports. Defaults are 8080/4173; E2E_BACKEND_PORT /
 * E2E_FRONTEND_PORT overrides let the suite run next to unrelated local services
 * (e.g. a media server on 8080) instead of refusing the whole run.
 * @param {Environment} [env] @returns {Ports}
 */
export function resolveE2EPorts(env = process.env) {
  /** @param {string | undefined} raw @param {number} fallback @returns {number} */
  const parse = (raw, fallback) => {
    if (raw === undefined || String(raw).trim() === "") return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error(`Invalid E2E port: ${raw}`);
    }
    return value;
  };
  return {
    backend: parse(env.E2E_BACKEND_PORT, 8080),
    frontend: parse(env.E2E_FRONTEND_PORT, 4173),
  };
}

/** @param {EarlyExitResult} earlyExit @param {{ ok: boolean, error?: string }} cleanupResult @param {(message: string) => void} log @returns {RunResult} */
function earlyExitRunResult(earlyExit, cleanupResult, log) {
  if ("error" in earlyExit) {
    log(`A required service failed to start: ${earlyExit.error.message}`);
    return { exitCode: 5, stage: "spawn-error", cleanupOk: cleanupResult.ok };
  }
  const exitCode = earlyExit.code !== null ? earlyExit.code : 1;
  const signalNote = earlyExit.signal ? ` (signal ${earlyExit.signal})` : "";
  log(
    `A required service exited with code ${exitCode}${signalNote} before it became ready.`,
  );
  return {
    exitCode: exitCode === 0 ? 1 : exitCode,
    stage: "child-exit",
    cleanupOk: cleanupResult.ok,
  };
}

/** @param {RunnerOptions} options @returns {Promise<RunResult>} */
export async function runFullstack({
  env,
  ports,
  readinessUrls,
  spawnBackend,
  spawnFrontend,
  spawnTest,
  prepareBackend: prepare = async () => ({ ok: true, artifactPath: "" }),
  timeoutMs = 30000,
  intervalMs = 200,
  signalGroup,
  isGroupAlive,
  groupKillGraceMs,
  log = () => {},
  processTarget = process,
}) {
  const envCheck = checkRequiredEnv(env);
  if (!envCheck.ok) {
    log(
      `Missing required environment variable(s): ${envCheck.missing.join(", ")}`,
    );
    return { exitCode: 2, stage: "preflight-env", missing: envCheck.missing };
  }

  const portCheck = await checkPortsFree(Object.values(ports));
  if (!portCheck.ok) {
    log(
      `Port(s) already in use, refusing to reuse: ${portCheck.occupied.join(", ")}`,
    );
    return {
      exitCode: 3,
      stage: "preflight-ports",
      occupied: portCheck.occupied,
    };
  }

  const cleanup = () =>
    cleanupAll(children, {
      signalGroup,
      isGroupAlive,
      graceMs: groupKillGraceMs,
    });
  const children = [spawnFrontend()];
  /** @type {EarlyExitResult | null} */
  let earlyExitResult = null;
  /** @type {NodeJS.Signals | null} */
  let trappedSignal = null;
  /** @type {(value: boolean) => void} */
  let resolveEarlyExit = () => {};
  const earlyExitRace = new Promise((resolve) => {
    resolveEarlyExit = resolve;
  });

  /** @param {NodeJS.Signals} signal */
  const onSignal = (signal) => {
    if (trappedSignal === null) {
      trappedSignal = signal;
      log(
        `Received ${signal}, terminating fullstack test run and cleaning up spawned processes...`,
      );
      if (earlyExitResult === null) {
        earlyExitResult = { code: null, signal };
        resolveEarlyExit(true);
      }
    }
  };

  if (processTarget && typeof processTarget.once === "function") {
    processTarget.once("SIGINT", onSignal);
    processTarget.once("SIGTERM", onSignal);
  }

  const removeSignalHandlers = () => {
    if (processTarget && typeof processTarget.removeListener === "function") {
      processTarget.removeListener("SIGINT", onSignal);
      processTarget.removeListener("SIGTERM", onSignal);
    }
  };

  /** @param {ChildProcess} child */
  const watchChild = (child) => {
    /** @param {EarlyExitResult} result */
    const settle = (result) => {
      if (earlyExitResult === null) {
        earlyExitResult = result;
        resolveEarlyExit(true);
      }
    };
    child.once(
      "exit",
      (
        /** @type {number | null} */ code,
        /** @type {NodeJS.Signals | null} */ signal,
      ) => settle({ code, signal }),
    );
    child.once("error", (/** @type {Error} */ error) => settle({ error }));
  };
  watchChild(children[0]);

  try {
    // Start the independent frontend build while Maven packages the backend JAR.
    const preparation = await prepare();
    if (trappedSignal !== null) {
      const cleanupResult = await cleanup();
      const exitCode = trappedSignal === "SIGINT" ? 130 : 143;
      log(`Run terminated by signal ${trappedSignal}.`);
      return {
        exitCode,
        stage: "signal-terminated",
        signal: trappedSignal,
        cleanupOk: cleanupResult.ok,
        cleanupError: cleanupResult.ok ? undefined : cleanupResult.error,
      };
    }
    if (earlyExitResult !== null) {
      const cleanupResult = await cleanup();
      return earlyExitRunResult(earlyExitResult, cleanupResult, log);
    }
    if (!preparation.ok) {
      const cleanupResult = await cleanup();
      log(
        `Backend preparation failed (${preparation.stage}); backend and browser were not started.`,
      );
      return {
        exitCode: 6,
        stage: "backend-preparation",
        preparation: preparation.stage,
        cleanupOk: cleanupResult.ok,
        cleanupError: cleanupResult.ok ? undefined : cleanupResult.error,
      };
    }

    try {
      children.push(spawnBackend());
    } catch (error) {
      const cleanupResult = await cleanup();
      log(
        `Backend service failed to spawn: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { exitCode: 5, stage: "spawn-error", cleanupOk: cleanupResult.ok };
    }
    watchChild(children[1]);
    const ready = await Promise.race([
      waitForReady(readinessUrls, { timeoutMs, intervalMs }),
      earlyExitRace,
    ]);
    if (trappedSignal !== null) {
      const cleanupResult = await cleanup();
      const exitCode = trappedSignal === "SIGINT" ? 130 : 143;
      log(`Run terminated by signal ${trappedSignal}.`);
      return {
        exitCode,
        stage: "signal-terminated",
        signal: trappedSignal,
        cleanupOk: cleanupResult.ok,
        cleanupError: cleanupResult.ok ? undefined : cleanupResult.error,
      };
    }
    if (earlyExitResult !== null) {
      const cleanupResult = await cleanup();
      return earlyExitRunResult(earlyExitResult, cleanupResult, log);
    }
    if (!ready) {
      const cleanupResult = await cleanup();
      log("Readiness check timed out before services became ready.");
      return {
        exitCode: 4,
        stage: "readiness-timeout",
        cleanupOk: cleanupResult.ok,
      };
    }

    const testChild = spawnTest();
    /** @type {Promise<TestOutcome>} */
    const testOutcomePromise = new Promise((resolve) => {
      testChild.once("exit", (code) => resolve({ code }));
      testChild.once("error", (error) => resolve({ error }));
    });
    const testOutcome = await Promise.race([
      testOutcomePromise,
      earlyExitRace.then(() => {
        try {
          if (!testChild.killed) testChild.kill("SIGTERM");
        } catch {}
        return { error: new Error("Interrupted by early exit or signal") };
      }),
    ]);

    if (trappedSignal !== null) {
      const cleanupResult = await cleanup();
      const exitCode = trappedSignal === "SIGINT" ? 130 : 143;
      log(`Run terminated by signal ${trappedSignal}.`);
      return {
        exitCode,
        stage: "signal-terminated",
        signal: trappedSignal,
        cleanupOk: cleanupResult.ok,
        cleanupError: cleanupResult.ok ? undefined : cleanupResult.error,
      };
    }
    if (earlyExitResult !== null) {
      const cleanupResult = await cleanup();
      return earlyExitRunResult(earlyExitResult, cleanupResult, log);
    }

    /** @type {number} */
    let testExitCode;
    if ("error" in testOutcome) {
      testExitCode = 1;
      log(`Test process failed to run: ${testOutcome.error.message}`);
    } else {
      testExitCode = testOutcome.code === null ? 1 : testOutcome.code;
    }

    const cleanupResult = await cleanup();
    if (!cleanupResult.ok)
      log(`Cleanup after tests reported an error: ${cleanupResult.error}`);
    const cleanupError = cleanupResult.ok ? undefined : cleanupResult.error;
    return {
      exitCode: testExitCode,
      stage: "completed",
      cleanupOk: cleanupResult.ok,
      cleanupError,
    };
  } finally {
    removeSignalHandlers();
  }
}

/** @returns {RunnerOptions} */
function buildCliOptions() {
  let backendArtifact = "";
  const ports = resolveE2EPorts();
  return {
    env: process.env,
    ports,
    readinessUrls: [
      `http://127.0.0.1:${ports.backend}/api/v3/api-docs`,
      `http://127.0.0.1:${ports.frontend}/`,
    ],
    // Independent budgets: Maven took 60.66s cold; service readiness exceeded 60s, with a 58.1s diagnostic probe.
    timeoutMs: Number(process.env.E2E_READY_TIMEOUT_MS || 120000),
    intervalMs: 500,
    prepareBackend: async () => {
      const result = await prepareBackend({
        command: "mvn",
        args: ["-f", "../backend/pom.xml", "-DskipTests", "package"],
        cwd: process.cwd(),
        artifactPath: "../backend/target/DentalClinicMVC-0.0.1-SNAPSHOT.jar",
        // Separate bounded preparation budget leaves time beyond the measured cold build.
        timeoutMs: Number(process.env.E2E_MAVEN_PREP_TIMEOUT_MS || 180000),
      });
      if (result.ok) backendArtifact = result.artifactPath;
      return result;
    },
    spawnBackend: () =>
      markOwnedProcessGroup(
        spawn("java", ["-jar", backendArtifact], {
          env: {
            ...process.env,
            SPRING_PROFILES_ACTIVE: "e2e",
            SERVER_PORT: String(ports.backend),
          },
          stdio: "inherit",
          detached: true,
        }),
      ),
    spawnFrontend: () =>
      markOwnedProcessGroup(
        spawn(
          "sh",
          [
            "-c",
            `npm run build && npm run preview -- --port ${ports.frontend} --strictPort`,
          ],
          {
            // apiFetch resolves BACKEND_URL from the environment at runtime;
            // without this the preview would target the default :8080 even when
            // the backend was spawned on an overridden port.
            env: {
              ...process.env,
              BACKEND_URL: `http://127.0.0.1:${ports.backend}`,
            },
            stdio: "inherit",
            detached: true,
          },
        ),
      ),
    spawnTest: () =>
      spawn(
        "npx",
        ["playwright", "test", "--config=playwright.fullstack.config.js"],
        {
          // The specs resolve services through these URLs; derive them from the
          // resolved ports so overrides work end to end without manual bookkeeping.
          env: {
            ...process.env,
            E2E_BACKEND_URL: `http://127.0.0.1:${ports.backend}`,
            E2E_FRONTEND_URL: `http://127.0.0.1:${ports.frontend}`,
          },
          stdio: "inherit",
        },
      ),
    log: (message) => console.error(`[e2e-fullstack] ${message}`),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runFullstack(buildCliOptions()).then((result) => {
    process.exitCode = result.exitCode;
  });
}
