import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(testsDir, "..");
const repoRoot = path.resolve(frontendDir, "..");
const realHookPath = path.join(repoRoot, ".githooks", "pre-commit");
const realFrontendScriptPath = path.join(
  frontendDir,
  "scripts",
  "pre-commit.sh",
);

/** @type {string[]} */
const tempDirs = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

/**
 * Creates a tracked temporary directory cleaned up after each test.
 * @param {string} prefix
 * @returns {string}
 */
function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/**
 * Returns a copy of `process.env` without any inherited `GIT_*` variables
 * so temp-repo commands never leak into or read from an outer `git commit`.
 * @returns {Record<string, string | undefined>}
 */
function cleanGitEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  );
}

/**
 * Runs a git command inside the given repository directory.
 * @param {string} cwd
 * @param {string[]} args
 */
function git(cwd, args) {
  execFileSync("git", args, {
    cwd,
    stdio: "pipe",
    env: {
      ...cleanGitEnv(),
      GIT_AUTHOR_NAME: "Test User",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test User",
      GIT_COMMITTER_EMAIL: "test@example.com",
    },
  });
}

/**
 * Creates an isolated temporary Git repository with the real `.githooks/pre-commit`
 * and stubbed `frontend/scripts/pre-commit.sh` and `backend/mvnw` scripts.
 * @param {{ frontendExitCode?: number, backendExitCode?: number }} [options]
 */
function createTempRepo(options = {}) {
  const { frontendExitCode = 0, backendExitCode = 0 } = options;
  const tmpDir = makeTempDir("dental-clinic-pre-commit-");
  const logFile = path.join(tmpDir, ".hook-calls.log");

  git(tmpDir, ["init"]);
  git(tmpDir, ["config", "user.name", "Test User"]);
  git(tmpDir, ["config", "user.email", "test@example.com"]);
  git(tmpDir, ["config", "commit.gpgsign", "false"]);

  const hookDir = path.join(tmpDir, ".githooks");
  const frontendScriptsDir = path.join(tmpDir, "frontend", "scripts");
  const backendDir = path.join(tmpDir, "backend");

  fs.mkdirSync(hookDir, { recursive: true });
  fs.mkdirSync(frontendScriptsDir, { recursive: true });
  fs.mkdirSync(backendDir, { recursive: true });

  const copiedHookPath = path.join(hookDir, "pre-commit");
  fs.copyFileSync(realHookPath, copiedHookPath);
  fs.chmodSync(copiedHookPath, 0o755);

  const stubFrontendScript = path.join(frontendScriptsDir, "pre-commit.sh");
  fs.writeFileSync(
    stubFrontendScript,
    `#!/bin/sh
set -eu
printf 'frontend|%s\\n' "$PWD" >> "$HOOK_LOG_FILE"
exit ${frontendExitCode}
`,
    { mode: 0o755 },
  );

  const stubMvnw = path.join(backendDir, "mvnw");
  fs.writeFileSync(
    stubMvnw,
    `#!/bin/sh
set -eu
printf 'backend|%s|%s\\n' "$PWD" "$*" >> "$HOOK_LOG_FILE"
exit ${backendExitCode}
`,
    { mode: 0o755 },
  );

  /**
   * Executes the copied pre-commit hook and returns exit status, output, and recorded calls.
   */
  function runHook() {
    const result = spawnSync("sh", [copiedHookPath], {
      cwd: tmpDir,
      encoding: "utf8",
      env: {
        ...cleanGitEnv(),
        HOOK_LOG_FILE: logFile,
      },
    });
    const calls = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean)
      : [];
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      calls,
    };
  }

  return {
    tmpDir,
    backendRealDir: fs.realpathSync(backendDir),
    runHook,
  };
}

/**
 * Writes a file relative to a directory, creating parent folders as needed.
 * @param {string} baseDir
 * @param {string} relPath
 * @param {string} content
 */
function writeRepoFile(baseDir, relPath, content) {
  const fullPath = path.join(baseDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

describe(".githooks/pre-commit routing and failure behavior", () => {
  it("keeps executable bits set on .githooks/pre-commit and frontend/scripts/pre-commit.sh", () => {
    expect(fs.statSync(realHookPath).mode & 0o111).not.toBe(0);
    expect(fs.statSync(realFrontendScriptPath).mode & 0o111).not.toBe(0);
  });

  it("skips both frontend and backend checks when only root/doc files are staged", () => {
    const { tmpDir, runHook } = createTempRepo();
    writeRepoFile(tmpDir, "README.md", "# Updated docs\n");
    git(tmpDir, ["add", "README.md"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toEqual([]);
  });

  it("runs only frontend checks when a frontend/ file is staged", () => {
    const { tmpDir, runHook } = createTempRepo();
    writeRepoFile(tmpDir, "frontend/src/example.js", "export const x = 1;\n");
    git(tmpDir, ["add", "frontend/src/example.js"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]).toMatch(/^frontend\|/);
  });

  it("handles non-ASCII frontend/ filenames via core.quotepath=false", () => {
    const { tmpDir, runHook } = createTempRepo();
    writeRepoFile(tmpDir, "frontend/diseño.md", "# Diseño\n");
    git(tmpDir, ["add", "frontend/diseño.md"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]).toMatch(/^frontend\|/);
  });

  it("runs only frontend checks when a frontend/ file deletion is staged", () => {
    const { tmpDir, runHook } = createTempRepo();
    writeRepoFile(
      tmpDir,
      "frontend/to-delete.js",
      "export const gone = true;\n",
    );
    git(tmpDir, ["add", "frontend/to-delete.js"]);
    git(tmpDir, ["commit", "--no-verify", "-m", "chore: seed file"]);

    git(tmpDir, ["rm", "frontend/to-delete.js"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]).toMatch(/^frontend\|/);
  });

  it("runs only backend spotless:check in backend/ when a backend/ file is staged", () => {
    const { tmpDir, backendRealDir, runHook } = createTempRepo();
    writeRepoFile(tmpDir, "backend/src/App.java", "class App {}\n");
    git(tmpDir, ["add", "backend/src/App.java"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toEqual([
      `backend|${backendRealDir}|-B spotless:check`,
    ]);
  });

  it("runs both frontend and backend checks when files in both directories are staged", () => {
    const { tmpDir, backendRealDir, runHook } = createTempRepo();
    writeRepoFile(tmpDir, "frontend/src/a.js", "export const a = 1;\n");
    writeRepoFile(tmpDir, "backend/src/A.java", "class A {}\n");
    git(tmpDir, ["add", "frontend/src/a.js", "backend/src/A.java"]);

    const result = runHook();
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(2);
    expect(result.calls[0]).toMatch(/^frontend\|/);
    expect(result.calls[1]).toBe(`backend|${backendRealDir}|-B spotless:check`);
  });

  it("exits non-zero and stops before backend checks if frontend checks fail", () => {
    const { tmpDir, runHook } = createTempRepo({ frontendExitCode: 1 });
    writeRepoFile(tmpDir, "frontend/src/a.js", "export const a = 1;\n");
    writeRepoFile(tmpDir, "backend/src/A.java", "class A {}\n");
    git(tmpDir, ["add", "frontend/src/a.js", "backend/src/A.java"]);

    const result = runHook();
    expect(result.status).not.toBe(0);
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]).toMatch(/^frontend\|/);
  });

  it("exits non-zero if backend spotless:check fails", () => {
    const { tmpDir, backendRealDir, runHook } = createTempRepo({
      backendExitCode: 1,
    });
    writeRepoFile(tmpDir, "frontend/src/a.js", "export const a = 1;\n");
    writeRepoFile(tmpDir, "backend/src/A.java", "class A {}\n");
    git(tmpDir, ["add", "frontend/src/a.js", "backend/src/A.java"]);

    const result = runHook();
    expect(result.status).not.toBe(0);
    expect(result.calls).toHaveLength(2);
    expect(result.calls[0]).toMatch(/^frontend\|/);
    expect(result.calls[1]).toBe(`backend|${backendRealDir}|-B spotless:check`);
  });

  it("ignores inherited outer GIT_* environment variables such as GIT_INDEX_FILE", () => {
    const saved = {
      GIT_INDEX_FILE: process.env.GIT_INDEX_FILE,
      GIT_DIR: process.env.GIT_DIR,
      GIT_WORK_TREE: process.env.GIT_WORK_TREE,
    };

    const outerIndex = path.join(
      os.tmpdir(),
      "dental-clinic-outer-index-should-not-be-used",
    );
    process.env.GIT_INDEX_FILE = outerIndex;
    process.env.GIT_DIR = path.join(
      os.tmpdir(),
      "dental-clinic-outer-git-dir-should-not-be-used",
    );
    process.env.GIT_WORK_TREE = path.join(
      os.tmpdir(),
      "dental-clinic-outer-work-tree-should-not-be-used",
    );

    try {
      const { tmpDir, runHook } = createTempRepo();
      writeRepoFile(
        tmpDir,
        "frontend/src/isolated.js",
        "export const ok = true;\n",
      );
      git(tmpDir, ["add", "frontend/src/isolated.js"]);

      const result = runHook();
      expect(result.status).toBe(0);
      expect(result.calls).toHaveLength(1);
      expect(result.calls[0]).toMatch(/^frontend\|/);
      expect(fs.existsSync(outerIndex)).toBe(false);
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });
});

describe("frontend/scripts/pre-commit.sh check order and fail-fast", () => {
  /**
   * Runs the real `frontend/scripts/pre-commit.sh` with a stubbed `npm` binary on PATH.
   * @param {{ failOnArgs?: string }} [options]
   */
  function runFrontendPreCommit(options = {}) {
    const { failOnArgs = "" } = options;
    const binDir = makeTempDir("dental-clinic-npm-stub-");
    const logFile = path.join(binDir, "npm-calls.log");
    const npmStub = path.join(binDir, "npm");

    fs.writeFileSync(
      npmStub,
      `#!/bin/sh
set -eu
printf '%s|%s\\n' "$PWD" "$*" >> "$NPM_LOG_FILE"
if [ -n "${failOnArgs}" ] && [ "$*" = "${failOnArgs}" ]; then
  exit 1
fi
exit 0
`,
      { mode: 0o755 },
    );

    const result = spawnSync("sh", [realFrontendScriptPath], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...cleanGitEnv(),
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
        NPM_LOG_FILE: logFile,
      },
    });

    const calls = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean)
      : [];

    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      calls,
    };
  }

  it("runs format:check, test, check, and typecheck in order from frontend/", () => {
    const frontendRealDir = fs.realpathSync(frontendDir);
    const result = runFrontendPreCommit();

    expect(result.status).toBe(0);
    expect(result.calls).toEqual([
      `${frontendRealDir}|run format:check`,
      `${frontendRealDir}|test`,
      `${frontendRealDir}|run check`,
      `${frontendRealDir}|run typecheck`,
    ]);
  });

  it("fails fast if npm run format:check fails without running slower checks", () => {
    const frontendRealDir = fs.realpathSync(frontendDir);
    const result = runFrontendPreCommit({ failOnArgs: "run format:check" });

    expect(result.status).not.toBe(0);
    expect(result.calls).toEqual([`${frontendRealDir}|run format:check`]);
  });
});
