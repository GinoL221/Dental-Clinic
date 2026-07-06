/**
 * TDD — postLogin: no-JS redirect + modular JSON (frontend-xss-token-hardening, PR3/Phase 4)
 *
 * postLogin.js had two branches after a successful backend auth:
 *   - isModularRequest (X-Requested-With: ModularAuth) -> already returned JSON.
 *   - else (legacy/no-JS fallback) -> returned a hand-built HTML page with an
 *     inline <script> that interpolated token/role/email/id/firstName/lastName
 *     UNESCAPED into a `localStorage.setItem('authToken', '${token}')` string.
 *     This is the proposal's item-4 script-injection sink AND the item-5
 *     JWT-into-JS leak in one place.
 *
 * PR3 design (updated after 4R resilience finding):
 *   - Modular branch (X-Requested-With: ModularAuth) -> res.json({ success, role, email, id, firstName, lastName })
 *     No `token` field — backend no longer sends it in the body (JWT is in httpOnly cookie).
 *   - Non-modular (no JS / JS blocked) -> res.redirect(303, '/').
 *     Cookies are already set before the branch decision; the browser follows the redirect
 *     with no JSON exposed on screen and no JS required.
 */

jest.mock('axios');
const axios = require('axios');
const postLogin = require('../src/controllers/auth/postLogin');

function buildReq(body, headers = {}) {
  return {
    body,
    headers,
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
    redirectTarget: null,
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
  res.redirect = jest.fn((status, url) => {
    res.statusCode = status;
    res.redirectTarget = url;
    return res;
  });
  res.cookie = jest.fn((name, value, opts) => {
    res.cookies.push({ name, value, opts });
    return res;
  });
  res.render = jest.fn();
  return res;
}

const backendData = {
  role: 'ADMIN',
  id: 1,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
};

beforeEach(() => {
  jest.clearAllMocks();
  axios.post.mockResolvedValue({ status: 200, data: backendData });
});

describe('postLogin — non-modular branch (no JS / JS blocked)', () => {
  test('a non-modular request gets a 303 redirect, not JSON or HTML', async () => {
    const req = buildReq({ email: 'ada@example.com', password: 'secret123' });
    const res = buildRes();

    await postLogin(req, res);

    expect(res.json).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(303, '/');
  });

  test('no <script> tag is emitted for a non-modular request', async () => {
    const req = buildReq({ email: 'ada@example.com', password: 'secret123' });
    const res = buildRes();

    await postLogin(req, res);

    const serialized = (res.sentBody || '') + (res.redirectTarget || '');
    expect(serialized).not.toMatch(/<script/i);
  });

  test("no localStorage.setItem('authToken') call is emitted for a non-modular request", async () => {
    const req = buildReq({ email: 'ada@example.com', password: 'secret123' });
    const res = buildRes();

    await postLogin(req, res);

    const serialized = (res.sentBody || '') + (res.redirectTarget || '');
    expect(serialized).not.toMatch(/localStorage\.setItem\(['"]authToken['"]/);
  });

  test('cookies are set before the redirect (httpOnly authToken, userRole, userEmail)', async () => {
    const req = buildReq({ email: 'ada@example.com', password: 'secret123' });
    const res = buildRes();

    await postLogin(req, res);

    expect(res.cookies.find((c) => c.name === 'authToken')).toBeDefined();
    expect(res.cookies.find((c) => c.name === 'userRole')).toBeDefined();
    expect(res.cookies.find((c) => c.name === 'userEmail')).toBeDefined();
    expect(res.redirect).toHaveBeenCalledTimes(1);
  });
});

describe('postLogin — modular branch (X-Requested-With: ModularAuth)', () => {
  test('a modular request gets a JSON response, not a redirect or HTML', async () => {
    const req = buildReq(
      { email: 'ada@example.com', password: 'secret123' },
      { 'x-requested-with': 'ModularAuth' },
    );
    const res = buildRes();

    await postLogin(req, res);

    expect(res.send).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('the JSON body contains success, role, email, id, firstName, lastName — no token field', async () => {
    const req = buildReq(
      { email: 'ada@example.com', password: 'secret123' },
      { 'x-requested-with': 'ModularAuth' },
    );
    const res = buildRes();

    await postLogin(req, res);

    expect(res.jsonBody).toMatchObject({
      success: true,
      role: backendData.role,
      email: backendData.email,
      id: backendData.id,
      firstName: backendData.firstName,
      lastName: backendData.lastName,
    });
    expect(res.jsonBody).not.toHaveProperty('token');
  });

  test('the JSON body contains no <script> tag', async () => {
    const req = buildReq(
      { email: 'ada@example.com', password: 'secret123' },
      { 'x-requested-with': 'ModularAuth' },
    );
    const res = buildRes();

    await postLogin(req, res);

    expect(JSON.stringify(res.jsonBody)).not.toMatch(/<script/i);
  });

  test('the httpOnly authToken cookie is set before the JSON response', async () => {
    const req = buildReq(
      { email: 'ada@example.com', password: 'secret123' },
      { 'x-requested-with': 'ModularAuth' },
    );
    const res = buildRes();

    await postLogin(req, res);

    const authCookie = res.cookies.find((c) => c.name === 'authToken');
    expect(authCookie).toBeDefined();
    expect(authCookie.opts).toMatchObject({ httpOnly: true, path: '/', sameSite: 'lax' });
  });
});
