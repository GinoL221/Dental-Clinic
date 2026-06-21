const request = require("supertest");
const app = require("../app");
const requireAuth = require("../src/middlewares/requireAuth");

// These tests cover server-side route protection for issue #11:
// protected pages (/dentists, /patients, /appointments, /dashboard) were
// rendering 200 for unauthenticated visitors instead of redirecting to login.
//
// Unlike the skipped 'Frontend basic routes' describe block in app.test.js,
// these tests do NOT need a live backend: for an unauthenticated request,
// requireAuth redirects BEFORE any backend-dependent rendering happens.
describe("requireAuth middleware - route protection (#11)", () => {
  describe("unauthenticated requests are redirected to /users/login", () => {
    test.each([
      ["/dentists"],
      ["/patients"],
      ["/appointments"],
      ["/dashboard"],
    ])("GET %s without a session redirects 302 to /users/login", async (route) => {
      const res = await request(app).get(route);
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("/users/login");
    });
  });

  describe("public routes remain accessible without a session", () => {
    test("GET / returns 200 (not redirected)", async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toBe(200);
    });

    test("GET /users/login returns 200 (not redirected)", async () => {
      const res = await request(app).get("/users/login");
      expect(res.statusCode).toBe(200);
    });
  });

  // Simulating a real authenticated session through supertest against the
  // full app would require either a live backend (postLogin calls the
  // backend API to validate credentials) or reimplementing session-cookie
  // signing manually. Both are heavier than necessary to prove the
  // middleware's authenticated branch. Instead we unit-test requireAuth in
  // isolation with a fake req/res/next, matching the same session-shape
  // convention already used by userDataMiddleware.
  describe("requireAuth (unit, authenticated path)", () => {
    test("calls next() and does not redirect when req.session.user exists", () => {
      const req = {
        session: {
          user: { id: 1, firstName: "Ada", lastName: "Lovelace", role: "PATIENT" },
        },
      };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test("redirects to /users/login and does not call next() when there is no session", () => {
      const req = { session: null };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith("/users/login");
      expect(next).not.toHaveBeenCalled();
    });

    test("redirects to /users/login when session exists but has no user", () => {
      const req = { session: {} };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith("/users/login");
      expect(next).not.toHaveBeenCalled();
    });
  });
});
