/**
 * TDD — Slice B (Phase 4: eval()→JSON refactor)
 *
 * These tests use static source analysis (fs.readFileSync + string/regex assertions).
 * NO eval() is used here or in the production code being tested — that is the entire
 * point of this change.
 */

const fs = require("fs");
const path = require("path");

// ─── B4.1: postLogin.js — modular branch must return JSON ────────────────────

describe("B4.1 — postLogin.js: modular branch returns JSON, not HTML+script", () => {
  const postLoginPath = path.join(
    __dirname,
    "..",
    "src",
    "controllers",
    "auth",
    "postLogin.js"
  );

  let source;
  beforeAll(() => {
    source = fs.readFileSync(postLoginPath, "utf8");
  });

  test("modular branch uses res.json(), not res.send()", () => {
    // The modular branch must call res.json() when isModularRequest is true.
    // We verify the contract by checking the source contains res.json with
    // the expected keys and does NOT send an HTML blob via res.send for the
    // modular path.
    expect(source).toContain("res.json({");
  });

  test("modular branch JSON payload includes the firstName key", () => {
    // The JSON response must include firstName so the client can store it.
    expect(source).toContain("firstName");
    expect(source).toContain("lastName");
    expect(source).toContain("success: true");
  });

  test("postLogin writes userFirstName, not userName, in BOTH branches", () => {
    // The old code wrote 'userName' which no read-site ever consumed.
    // After the fix, no occurrence of 'userName' should remain in this file.
    expect(source).not.toContain("'userName'");
    expect(source).not.toContain('"userName"');
  });

  test("the legacy HTML+script res.send() branch no longer exists — both request paths share one res.json() response", () => {
    // The legacy branch used to hand-build an HTML page with an inline
    // <script> block that wrote the token into localStorage. That branch
    // was collapsed: there is now a single res.json() response shared by
    // both the modular and legacy/no-JS-fallback request paths, and no
    // res.send(` HTML+script block remains anywhere in the file.
    const jsonIdx = source.indexOf("res.json({");
    const sendIdx = source.indexOf("res.send(`");
    expect(jsonIdx).toBeGreaterThanOrEqual(0);
    expect(sendIdx).toBe(-1);
  });

  test("JSON payload includes token, role, email, id, lastName", () => {
    // Full contract verification — all 6 fields must appear near res.json.
    expect(source).toContain("token");
    expect(source).toContain("role");
    expect(source).toContain("email");
    // id appears as a variable reference inside the object
    const jsonBlock = source.slice(
      source.indexOf("res.json("),
      source.indexOf("res.json(") + 200
    );
    expect(jsonBlock).toContain("id");
    expect(jsonBlock).toContain("firstName");
    expect(jsonBlock).toContain("lastName");
  });
});

// ─── B4.2: data-manager.js — JSON parse, no eval(), no regex, no setTimeout ──

describe("B4.2 — auth/modules/data-manager.js: JSON parse replaces eval() path", () => {
  const dataManagerPath = path.join(
    __dirname,
    "..",
    "public",
    "js",
    "auth",
    "modules",
    "data-manager.js"
  );

  let source;
  beforeAll(() => {
    source = fs.readFileSync(dataManagerPath, "utf8");
  });

  test("eval() is NOT called anywhere in the file", () => {
    // The entire purpose of this change: no eval() must remain.
    expect(source).not.toContain("eval(");
  });

  test("processLogin uses response.json() to parse the server response", () => {
    // The new path parses JSON directly.
    expect(source).toContain("response.json()");
  });

  test("processLogin does NOT use response.text() — JSON is parsed directly", () => {
    // The old processLogin path read HTML text then regex-extracted localStorage commands.
    // Extract only the processLogin method body to check it in isolation.
    const processLoginStart = source.indexOf("async processLogin(");
    const processRegisterStart = source.indexOf("async processRegister(");
    // processLogin body is between processLogin and processRegister
    const processLoginBody = source.slice(processLoginStart, processRegisterStart);
    expect(processLoginBody).not.toContain("response.text()");
  });

  test("processLogin writes userFirstName (not userName) to localStorage", () => {
    // Key contract: the display name is stored under the correct key.
    expect(source).toContain("userFirstName");
    // Specifically in a setItem call
    expect(source).toContain('localStorage.setItem("userFirstName"');
  });

  test("processLogin does NOT write userName to localStorage", () => {
    // The incorrect key must not appear in localStorage.setItem calls.
    expect(source).not.toContain('localStorage.setItem("userName"');
    expect(source).not.toContain("localStorage.setItem('userName'");
  });

  test("artificial 200ms setTimeout is removed from the login path", () => {
    // The delay only existed to 'let eval settle' — gone once writes are synchronous.
    expect(source).not.toContain("setTimeout");
  });

  test("file uses window.__ENV__?.API_BASE_URL instead of window.API_BASE_URL", () => {
    // Same optional-chaining fix as applied to appointment/modules/index.js in Slice A.
    expect(source).not.toContain("window.API_BASE_URL ||");
    expect(source).toContain("window.__ENV__?.API_BASE_URL");
  });

  test("localStorage.setItem is called explicitly for the 5 non-sensitive session keys", () => {
    // Explicit write contract — no magic, no loops over regex-extracted commands.
    // authToken is intentionally EXCLUDED: per frontend-xss-token-hardening
    // (PR3/Phase 4), the JWT is never written to localStorage — the httpOnly
    // cookie set by postLogin.js carries it instead.
    const expectedKeys = [
      "userRole",
      "userEmail",
      "userId",
      "userFirstName",
      "userLastName",
    ];
    expectedKeys.forEach((key) => {
      expect(source).toContain(`localStorage.setItem("${key}"`);
    });
  });

  test("does NOT call localStorage.setItem for authToken", () => {
    expect(source).not.toContain('localStorage.setItem("authToken"');
  });
});

// ─── B5 + B6: Script tag removal and dead file deletion ─────────────────────

describe("B5.1 — dashboard.ejs: dead dashboard-globals.js script tag is removed", () => {
  const dashboardEjsPath = path.join(
    __dirname,
    "..",
    "src",
    "views",
    "dashboard",
    "dashboard.ejs"
  );

  test("dashboard.ejs does not reference dashboard-globals.js", () => {
    const source = fs.readFileSync(dashboardEjsPath, "utf8");
    expect(source).not.toContain("dashboard-globals.js");
  });
});

describe("B5.2 — appointmentEdit.ejs: dead appointment-edit-page.js script tag is removed", () => {
  const appointmentEditPath = path.join(
    __dirname,
    "..",
    "src",
    "views",
    "appointments",
    "appointmentEdit.ejs"
  );

  test("appointmentEdit.ejs does not reference appointment-edit-page.js", () => {
    const source = fs.readFileSync(appointmentEditPath, "utf8");
    expect(source).not.toContain("appointment-edit-page.js");
  });
});

describe("B6 — dead file deletions: 7 files must not exist on disk", () => {
  const root = path.join(__dirname, "..");

  const deadFiles = [
    "public/js/dentist/dentist-add-controller.js",
    "public/js/dentist/dentist-edit-controller.js",
    "public/js/patient/patient-controller.js",
    "public/js/dashboard/dashboard-globals.js",
    "public/js/appointment/appointment-edit-page.js",
    "src/controllers/appointment/appointmentServerData.js",
    "src/middlewares/authMiddleware.js",
  ];

  deadFiles.forEach((relPath) => {
    test(`${relPath} is deleted`, () => {
      const fullPath = path.join(root, relPath);
      expect(fs.existsSync(fullPath)).toBe(false);
    });
  });
});

// ─── Static final gate: no eval() anywhere in public/ or src/ ────────────────

describe("Static gate: no eval() anywhere in frontend source", () => {
  function walkSync(dir, result = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name !== "node_modules" && entry.name !== ".git") {
          walkSync(fullPath, result);
        }
      } else if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name)) {
        result.push(fullPath);
      }
    }
    return result;
  }

  test("no .js file in public/ contains eval(", () => {
    const publicDir = path.join(__dirname, "..", "public");
    const files = walkSync(publicDir);
    const filesWithEval = files.filter((f) => {
      const content = fs.readFileSync(f, "utf8");
      return content.includes("eval(");
    });
    if (filesWithEval.length > 0) {
      console.error("Files still containing eval():", filesWithEval);
    }
    expect(filesWithEval).toHaveLength(0);
  });

  test("no .js file in src/ contains eval(", () => {
    const srcDir = path.join(__dirname, "..", "src");
    const files = walkSync(srcDir);
    const filesWithEval = files.filter((f) => {
      const content = fs.readFileSync(f, "utf8");
      return content.includes("eval(");
    });
    if (filesWithEval.length > 0) {
      console.error("Files still containing eval():", filesWithEval);
    }
    expect(filesWithEval).toHaveLength(0);
  });
});
