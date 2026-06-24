/**
 * TDD — postLogin JSON collapse + token-removal (frontend-xss-token-hardening, PR3/Phase 4)
 *
 * postLogin.js had two branches after a successful backend auth:
 *   - isModularRequest (X-Requested-With: ModularAuth) -> already returned JSON.
 *   - else (legacy/no-JS fallback) -> returned a hand-built HTML page with an
 *     inline <script> that interpolated token/role/email/id/firstName/lastName
 *     UNESCAPED into a `localStorage.setItem('authToken', '${token}')` string.
 *     This is the proposal's item-4 script-injection sink AND the item-5
 *     JWT-into-JS leak in one place.
 *
 * This slice collapses the legacy branch into the SAME JSON shape as the
 * modular branch (no more branching on X-Requested-With for the response
 * shape) and removes the inline-script `authToken` writer entirely. Mocks
 * axios so no live backend is needed — matches this repo's existing pattern
 * of unit-testing auth controllers in isolation (see test/require-auth.test.js
 * for the documented rationale).
 */

jest.mock("axios");
const axios = require("axios");
const postLogin = require("../src/controllers/auth/postLogin");

// express-validator's validationResult reads metadata that
// app.use(expressValidatorMiddleware) attaches to req. For a controller unit
// test we bypass it by giving req the shape validationResult expects when
// there are no errors: no req._validationErrors that would be flagged.
// validationResult(req) defaults to "no errors" when express-validator's
// internal symbol-keyed bag is absent, which is the case for a plain object.

function buildReq(body) {
  return {
    body,
    headers: {},
    session: {
      save: (cb) => cb(),
    },
  };
}

function buildRes() {
  const res = {
    statusCode: 200,
    jsonBody: null,
    sentBody: null,
    cookies: [],
  };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body) => {
    res.jsonBody = body;
    return res;
  });
  res.send = jest.fn((body) => {
    res.sentBody = body;
    return res;
  });
  res.cookie = jest.fn((name, value, opts) => {
    res.cookies.push({ name, value, opts });
    return res;
  });
  res.render = jest.fn();
  return res;
}

describe("postLogin — non-modular branch returns JSON, no inline <script> sink", () => {
  const backendData = {
    token: "fake.jwt.token",
    role: "ADMIN",
    id: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ status: 200, data: backendData });
  });

  test("a non-modular request (no X-Requested-With header) gets a JSON response, not an HTML page", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    const res = buildRes();

    await postLogin(req, res);

    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test("the response body (whichever of res.json/res.send was used) contains no <script> tag", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    const res = buildRes();

    await postLogin(req, res);

    const serialized = JSON.stringify(res.jsonBody) + (res.sentBody || "");
    expect(serialized).not.toMatch(/<script/i);
  });

  test("the response body does not contain a localStorage.setItem('authToken', ...) string", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    const res = buildRes();

    await postLogin(req, res);

    const serialized = JSON.stringify(res.jsonBody) + (res.sentBody || "");
    expect(serialized).not.toMatch(/localStorage\.setItem\(['"]authToken['"]/);
  });

  test("the JSON shape matches the modular branch: success, token, role, email, id, firstName, lastName", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    const res = buildRes();

    await postLogin(req, res);

    expect(res.jsonBody).toMatchObject({
      success: true,
      token: backendData.token,
      role: backendData.role,
      email: backendData.email,
      id: backendData.id,
      firstName: backendData.firstName,
      lastName: backendData.lastName,
    });
  });

  test("a modular request (X-Requested-With: ModularAuth) still gets the same JSON shape (no behavior change)", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    req.headers["x-requested-with"] = "ModularAuth";
    const res = buildRes();

    await postLogin(req, res);

    expect(res.send).not.toHaveBeenCalled();
    expect(res.jsonBody).toMatchObject({
      success: true,
      token: backendData.token,
      role: backendData.role,
      email: backendData.email,
      id: backendData.id,
    });
  });

  test("the httpOnly authToken cookie is still set server-side (unchanged cookie-attribute block)", async () => {
    const req = buildReq({ email: "ada@example.com", password: "secret123" });
    const res = buildRes();

    await postLogin(req, res);

    const authCookie = res.cookies.find((c) => c.name === "authToken");
    expect(authCookie).toBeDefined();
    expect(authCookie.value).toBe(backendData.token);
    expect(authCookie.opts).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax" });
  });
});
