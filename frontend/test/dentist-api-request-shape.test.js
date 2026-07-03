/**
 * Tests for the Dentist request-shape changes (Slice B of the
 * patient-dentist-request-dtos SDD change).
 * Strategy: static source analysis (same pattern as
 * patient-api-request-shape.test.js) — dentist-api.js is a browser ES module
 * that can't be required directly by Node/Jest without heavy DOM/fetch
 * mocking, so we assert on the source text for deterministic RED/GREEN
 * cycles.
 */

const fs = require("fs");
const path = require("path");

const dentistApiPath = path.join(
  __dirname,
  "..",
  "public",
  "js",
  "api",
  "dentist-api.js"
);
const src = fs.readFileSync(dentistApiPath, "utf8");

describe("DentistAPI.update: PUT /api/dentists/{id}, id not in body", () => {
  const updateBlock = src.slice(
    src.indexOf("async update("),
    src.indexOf("// Eliminar un dentista")
  );

  test("targets /api/dentists/${targetId} (path id, not the bare collection URL)", () => {
    expect(updateBlock).toContain(
      "`${API_BASE_URL}/api/dentists/${targetId}`"
    );
    expect(updateBlock).not.toContain("`${API_BASE_URL}/api/dentists`");
  });

  test("strips id from the outgoing body before serializing", () => {
    expect(updateBlock).toContain("delete dentist.id");
  });
});
