import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(testsDir, "..");

/**
 * Extracts --config and --project flags from a playwright CLI command string.
 * @param {string} command
 */
function parsePlaywrightFlags(command) {
  const configMatch = command.match(/(?:--config=|--config\s+)([^\s"']+)/);
  const projectMatches = [
    ...command.matchAll(/(?:--project=|--project\s+)([^\s"']+)/g),
  ].map((m) => m[1]);

  return {
    configFile: configMatch ? configMatch[1] : "playwright.config.js",
    projects: projectMatches,
  };
}

/**
 * Loads declared project names from a Playwright ESM config using Node.js.
 * @param {string} configPath
 * @returns {string[]}
 */
function loadDeclaredProjects(configPath) {
  const raw = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import(${JSON.stringify(pathToFileURL(configPath).href)}).then((m) => { const names = (m.default?.projects || []).map((p) => p.name); process.stdout.write(JSON.stringify(names)); })`,
    ],
    { cwd: frontendDir, encoding: "utf8" },
  );
  return JSON.parse(raw);
}

/**
 * Validates that every `test*` script referencing Playwright points to an
 * existing config file and only declares `--project` names that exist in it.
 * @param {string} rootDir
 */
export async function assertNoPlaywrightScriptDrift(rootDir) {
  const pkgPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const scripts = pkg.scripts || {};

  for (const [name, command] of Object.entries(scripts)) {
    if (!name.startsWith("test") || typeof command !== "string") continue;

    if (/\bplaywright\s+test\b/.test(command)) {
      const { configFile, projects } = parsePlaywrightFlags(command);
      const configPath = path.resolve(rootDir, configFile);
      if (!fs.existsSync(configPath)) {
        throw new Error(
          `Script "${name}" references missing Playwright config: ${configFile}`,
        );
      }

      const declaredProjects = loadDeclaredProjects(configPath);

      if (declaredProjects.length === 0) {
        throw new Error(
          `Playwright config "${configFile}" (used by "${name}") declares no projects`,
        );
      }

      for (const projectName of projects) {
        if (!declaredProjects.includes(projectName)) {
          throw new Error(
            `Script "${name}" references unknown project "${projectName}" in ${configFile} (declared: ${declaredProjects.join(", ")})`,
          );
        }
      }
    }

    if (name === "test:e2e:fullstack") {
      const runnerMatch = command.match(/\bnode\s+([^\s]+\.js)/);
      if (runnerMatch) {
        const runnerPath = path.resolve(rootDir, runnerMatch[1]);
        if (!fs.existsSync(runnerPath)) {
          throw new Error(
            `Script "${name}" references missing runner: ${runnerMatch[1]}`,
          );
        }
        const runnerSource = fs.readFileSync(runnerPath, "utf8");
        const cfgMatch = runnerSource.match(/--config=([^\s"'`]+)/);
        if (cfgMatch) {
          const cfgPath = path.resolve(rootDir, cfgMatch[1]);
          if (!fs.existsSync(cfgPath)) {
            throw new Error(
              `Runner "${runnerMatch[1]}" references missing Playwright config: ${cfgMatch[1]}`,
            );
          }
          const declaredProjects = loadDeclaredProjects(cfgPath);
          if (declaredProjects.length === 0) {
            throw new Error(
              `Playwright config "${cfgMatch[1]}" (used by "${name}") declares no projects`,
            );
          }
        }
      }
    }
  }
}

describe("Playwright script/config drift guard", () => {
  it("all test* scripts in package.json match existing Playwright configs and projects", async () => {
    await expect(
      assertNoPlaywrightScriptDrift(frontendDir),
    ).resolves.toBeUndefined();
  });

  it("detects drift when a script references a missing or commented-out project", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-drift-"));
    try {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "drift-fixture",
          type: "module",
          scripts: {
            "test:webkit": "playwright test --project=webkit",
          },
        }),
      );
      fs.writeFileSync(
        path.join(tmpDir, "playwright.config.js"),
        `export default {
          projects: [
            { name: "chromium" },
            // { name: "webkit" },
          ],
        };`,
      );

      await expect(assertNoPlaywrightScriptDrift(tmpDir)).rejects.toThrow(
        /unknown project "webkit"/,
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
