/**
 * TDD — Duplicate `window.*` Assignment Guard
 *
 * Two independent DOMContentLoaded listeners (canonical modules/index.js +
 * page wrapper) can each instantiate+publish+init the same entity's
 * controller, racing each other and re-publishing window.* globals. A prior
 * fix (337d380) closed one instance of this bug class in dentist-controller.js.
 * This guard is a static-source Jest test that prevents the bug class from
 * being reintroduced anywhere in the canonical+wrapper file-sets, for any
 * of the 4 entities, by failing the build whenever two files in the same
 * entity's set assign the same non-exempt `window.<name>` global.
 *
 * Strategy: static source analysis (fs.readFileSync + regex/string
 * assertions), same pattern as *-srp-split.test.js. No DOM/jsdom runtime
 * harness, no module execution — this only ever reads source text.
 */

const fs = require("fs");
const path = require("path");

const jsRoot = path.join(__dirname, "..", "public", "js");

// ─── Single source of truth: entity file-sets (spec's Entity File-Set Definition) ───

const ENTITY_FILE_SETS = {
  appointment: {
    canonical: "appointment/modules/index.js",
    wrappers: [
      "appointment/appointment-controller.js",
      "appointment/appointment-list-controller.js",
    ],
    singletonGlobal: "appointmentController",
  },
  patient: {
    canonical: "patient/modules/index.js",
    wrappers: [
      "patient/patient-add-controller.js",
      "patient/patient-edit-controller.js",
      "patient/patient-list-controller.js",
    ],
    singletonGlobal: "patientController",
  },
  dentist: {
    canonical: "dentist/modules/index.js",
    wrappers: [
      "dentist/dentist-controller.js",
      "dentist/dentist-list-controller.js",
    ],
    singletonGlobal: "dentistController",
  },
  auth: {
    canonical: "auth/modules/index.js",
    wrappers: ["auth/login-controller.js", "auth/register-controller.js"],
    singletonGlobal: "authController",
  },
};

const EXCLUDED_FILES = [
  "dentist/dentist-specialty-ui.js",
  "dashboard/dashboard-controller.js",
];

function filesInSet(entity) {
  const set = ENTITY_FILE_SETS[entity];
  return [set.canonical, ...set.wrappers];
}

function allInScopeFiles() {
  return Object.keys(ENTITY_FILE_SETS).flatMap((entity) => filesInSet(entity));
}

// ─── Assignment extraction: window.<name> = <any RHS style> ───

// Matches `window.<identifier> = ` at a top-level assignment position,
// regardless of RHS style (arrow fn, async arrow, function expr, async
// function expr, direct value/instance). Deliberately requires `=` NOT
// followed by another `=` (so `window.x === y` reads are never matched)
// and is not anchored to line-start so it also matches assignments after
// leading whitespace/indentation.
const WINDOW_ASSIGNMENT_REGEX = /window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/g;

function extractWindowAssignments(source) {
  const names = new Set();
  let match;
  WINDOW_ASSIGNMENT_REGEX.lastIndex = 0;
  while ((match = WINDOW_ASSIGNMENT_REGEX.exec(source)) !== null) {
    names.add(match[1]);
  }
  return names;
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(jsRoot, relativePath), "utf8");
}

// ─── Guard: scans exactly the defined file-sets ───

describe("global-wiring-source guard: file-set scope", () => {
  // Appointment: 1 canonical + 2 wrappers = 3
  // Patient: 1 canonical + 3 wrappers = 4
  // Dentist: 1 canonical + 2 wrappers = 3
  // Auth: 1 canonical + 2 wrappers = 3
  // Total = 13 (the spec's "11 files total" summary undercounts its own
  // table; this assertion follows the table, the actual source of truth).
  test("scans exactly the 4 entity file-sets (13 files total)", () => {
    const files = allInScopeFiles();
    expect(files).toHaveLength(13);
  });

  test("does not include dentist-specialty-ui.js or dashboard-controller.js in scope", () => {
    const files = allInScopeFiles();
    EXCLUDED_FILES.forEach((excluded) => {
      expect(files).not.toContain(excluded);
    });
  });
});

// ─── Guard: assignment-extraction regex correctness ───

describe("global-wiring-source guard: assignment detection rule", () => {
  test("matches arrow function assignment style", () => {
    const source = readSource("dentist/modules/index.js");
    const names = extractWindowAssignments(source);
    expect(names.has("editDentist")).toBe(true);
  });

  test("matches async function expression assignment style", () => {
    const source = readSource("auth/modules/index.js");
    const names = extractWindowAssignments(source);
    expect(names.has("login")).toBe(true);
  });

  test("matches direct value/instance assignment style", () => {
    // Post single-listener-delegation migration, the direct value/instance
    // assignment for the singleton now lives only in the canonical's
    // getInstance() (the wrapper defers via initDentistController() and no
    // longer assigns window.dentistController itself).
    const source = readSource("dentist/modules/index.js");
    const names = extractWindowAssignments(source);
    expect(names.has("dentistController")).toBe(true);
  });

  test("matches function expression assignment style", () => {
    const source = readSource("dentist/dentist-controller.js");
    const names = extractWindowAssignments(source);
    expect(names.has("refreshDentists")).toBe(true);
  });

  test("does not flag window reads or window.location access as assignments", () => {
    const fixture = `
      if (window.dentistController) {
        doSomething();
      }
      const path = window.location.pathname;
    `;
    const names = extractWindowAssignments(fixture);
    expect(names.has("dentistController")).toBe(false);
    expect(names.has("location")).toBe(false);
  });
});

// ─── Guard: duplicate-name detection across each entity's file-set ───

describe("global-wiring-source guard: duplicate window.* assignment detection", () => {
  Object.entries(ENTITY_FILE_SETS).forEach(([entity, set]) => {
    test(`${entity}: no non-singleton window.* global is assigned in 2+ files of its file-set`, () => {
      const files = filesInSet(entity);

      // Map global name -> list of files that assign it.
      const assignedIn = new Map();

      files.forEach((relativePath) => {
        const source = readSource(relativePath);
        const names = extractWindowAssignments(source);
        names.forEach((name) => {
          if (!assignedIn.has(name)) {
            assignedIn.set(name, []);
          }
          assignedIn.get(name).push(relativePath);
        });
      });

      const violations = [];
      assignedIn.forEach((assignedFiles, globalName) => {
        if (globalName === set.singletonGlobal) {
          // Exempt: singleton-controller-instance global is expected to be
          // assigned in both canonical and wrapper(s) by design (already
          // guarded by the existing check-before-create pattern).
          return;
        }
        if (assignedFiles.length >= 2) {
          violations.push({ globalName, files: assignedFiles });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `window.${v.globalName} is assigned in ${v.files.length} files of the ${entity} file-set: ${v.files.join(", ")}`
          )
          .join("\n");
        throw new Error(
          `Duplicate window.* assignment(s) found in ${entity} file-set:\n${message}`
        );
      }

      expect(violations).toEqual([]);
    });
  });
});

// ─── Guard: singleton duplication is explicitly exempt, not just absent ───

describe("global-wiring-source guard: singleton exemption", () => {
  test("dentistController is assigned by the canonical and the exemption rule covers it even if a wrapper also assigned it", () => {
    // Post single-listener-delegation migration, dentist-controller.js and
    // dentist-list-controller.js both defer to initDentistController() and no
    // longer assign window.dentistController themselves — the canonical's
    // getInstance() is the sole real assignment point now. This test still
    // pins two things: (1) the canonical genuinely assigns the singleton
    // global (real-source check), and (2) the exemption rule in the
    // duplicate-detection logic tolerates a hypothetical second assignment
    // of the same singleton name without flagging it as a violation
    // (synthetic-fixture check) — guarding against a future regression that
    // reintroduces a wrapper-side assignment.
    const canonical = readSource(ENTITY_FILE_SETS.dentist.canonical);
    expect(extractWindowAssignments(canonical).has("dentistController")).toBe(
      true
    );

    const assignedIn = new Map([
      ["dentistController", ["dentist/modules/index.js", "dentist/dentist-controller.js"]],
    ]);
    const violations = [];
    assignedIn.forEach((files, globalName) => {
      if (globalName === ENTITY_FILE_SETS.dentist.singletonGlobal) return;
      if (files.length >= 2) violations.push({ globalName, files });
    });
    expect(violations).toEqual([]);
  });
});

// ─── Guard: actionable failure output (regression-proof via isolated helper) ───

describe("global-wiring-source guard: actionable failure message shape", () => {
  // This exercises the same violation-detection + message-building logic
  // used by the per-entity test above, against a synthetic fixture, so the
  // message format itself is pinned independently of current source state.
  function findViolations(fileSources, singletonGlobal) {
    const assignedIn = new Map();
    Object.entries(fileSources).forEach(([relativePath, source]) => {
      const names = extractWindowAssignments(source);
      names.forEach((name) => {
        if (!assignedIn.has(name)) {
          assignedIn.set(name, []);
        }
        assignedIn.get(name).push(relativePath);
      });
    });

    const violations = [];
    assignedIn.forEach((files, globalName) => {
      if (globalName === singletonGlobal) return;
      if (files.length >= 2) {
        violations.push({ globalName, files });
      }
    });
    return violations;
  }

  function buildMessage(entity, violations) {
    const message = violations
      .map(
        (v) =>
          `window.${v.globalName} is assigned in ${v.files.length} files of the ${entity} file-set: ${v.files.join(", ")}`
      )
      .join("\n");
    return `Duplicate window.* assignment(s) found in ${entity} file-set:\n${message}`;
  }

  test("failure message names the offending global and both file paths", () => {
    const fileSources = {
      "dentist/modules/index.js": "window.searchDentists = (term) => {};",
      "dentist/dentist-list-controller.js":
        "window.searchDentists = function (term) {};",
    };

    const violations = findViolations(fileSources, "dentistController");
    expect(violations).toHaveLength(1);

    const message = buildMessage("dentist", violations);
    expect(message).toContain("searchDentists");
    expect(message).toContain("dentist/modules/index.js");
    expect(message).toContain("dentist/dentist-list-controller.js");
  });

  test("does not report a violation for the expected singleton duplication", () => {
    const fileSources = {
      "dentist/modules/index.js":
        "window.dentistController = new DentistController();",
      "dentist/dentist-controller.js":
        "window.dentistController = dentistController;",
    };

    const violations = findViolations(fileSources, "dentistController");
    expect(violations).toEqual([]);
  });
});
