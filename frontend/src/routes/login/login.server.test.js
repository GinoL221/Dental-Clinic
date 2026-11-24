import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "../../lib/api.js";
import { createMockEvent } from "../../test/mockFactory.js";

vi.mock("../../lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Login Route Server Actions & Loader", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("load()", () => {
    it("should redirect to / if user is already logged in", async () => {
      const event = createMockEvent({
        locals: {
          user: { id: 1, email: "user@email.com", role: "PATIENT" },
        },
      });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/",
      });
    });

    it("should return empty object if user is not logged in", async () => {
      const event = createMockEvent({ locals: {} });
      const result = await load(event);
      expect(result).toEqual({});
    });
  });

  describe("actions.default", () => {
    it("should login successfully and set cookies", async () => {
      const formData = new URLSearchParams();
      formData.append("email", "admin@dentalclinic.com");
      formData.append("password", "Admin123!");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const cookies = {
        set: vi.fn(),
      };

      vi.mocked(api.apiFetch).mockResolvedValue({
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@dentalclinic.com",
        role: "ADMIN",
        token: "mock-jwt-token",
      });

      const event = createMockEvent({ request, cookies });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/dashboard",
      });

      expect(api.apiFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@dentalclinic.com",
          password: "Admin123!",
        }),
      });

      const expectedCookieOptions = {
        path: "/",
        httpOnly: true,
        maxAge: 36000,
        sameSite: "lax",
        secure: false,
      };

      expect(cookies.set).toHaveBeenCalledWith(
        "authToken",
        "mock-jwt-token",
        expectedCookieOptions,
      );
      expect(cookies.set).toHaveBeenCalledWith(
        "userRole",
        "ADMIN",
        expectedCookieOptions,
      );
      expect(cookies.set).toHaveBeenCalledWith(
        "userEmail",
        "admin@dentalclinic.com",
        expectedCookieOptions,
      );
    });

    it("should set secure cookie flag on HTTPS requests", async () => {
      const formData = new URLSearchParams();
      formData.append("email", "admin@dentalclinic.com");
      formData.append("password", "Admin123!");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };
      const cookies = { set: vi.fn() };

      vi.mocked(api.apiFetch).mockResolvedValue({
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@dentalclinic.com",
        role: "ADMIN",
        token: "mock-jwt-token",
      });

      const event = createMockEvent({
        request,
        cookies,
        url: new URL("https://dental-clinic.up.railway.app/login"),
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/dashboard",
      });

      expect(cookies.set).toHaveBeenCalledWith("authToken", "mock-jwt-token", {
        path: "/",
        httpOnly: true,
        maxAge: 36000,
        sameSite: "lax",
        secure: true,
      });
    });

    it("should return error credentials on 401", async () => {
      const formData = new URLSearchParams();
      formData.append("email", "wrong@email.com");
      formData.append("password", "wrong");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };
      const cookies = { set: vi.fn() };

      const error = Object.assign(new Error("Unauthorized"), { status: 401 });
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({ request, cookies });
      const result = await actions.default(event);

      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: "Credenciales incorrectas" },
        },
        oldData: { email: "wrong@email.com" },
      });
    });

    it("should forward X-Client-IP and X-BFF-Auth when BFF_SHARED_SECRET is configured", async () => {
      const prev = process.env.BFF_SHARED_SECRET;
      process.env.BFF_SHARED_SECRET = "bff-secret-test";
      try {
        const formData = new URLSearchParams();
        formData.append("email", "admin@dentalclinic.com");
        formData.append("password", "Admin123!");

        const request = {
          formData: vi.fn().mockResolvedValue(formData),
        };
        const cookies = { set: vi.fn() };

        vi.mocked(api.apiFetch).mockResolvedValue({
          id: 1,
          role: "ADMIN",
          token: "mock-jwt-token",
        });

        const event = createMockEvent({
          request,
          cookies,
          getClientAddress: vi.fn(() => "203.0.113.42"),
        });

        await expect(actions.default(event)).rejects.toMatchObject({
          status: 303,
          location: "/dashboard",
        });

        expect(api.apiFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-IP": "203.0.113.42",
            "X-BFF-Auth": "bff-secret-test",
          },
          body: JSON.stringify({
            email: "admin@dentalclinic.com",
            password: "Admin123!",
          }),
        });
      } finally {
        if (prev === undefined) delete process.env.BFF_SHARED_SECRET;
        else process.env.BFF_SHARED_SECRET = prev;
      }
    });

    it("should surface backend message on 429 rate-limit responses", async () => {
      const formData = new URLSearchParams();
      formData.append("email", "admin@dentalclinic.com");
      formData.append("password", "wrong");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };
      const cookies = { set: vi.fn() };

      const error = Object.assign(
        new Error("Demasiados intentos en poco tiempo. Esperá unos segundos."),
        { status: 429 },
      );
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({ request, cookies });
      const result = await actions.default(event);

      expect(result).toEqual({
        success: false,
        errors: {
          general: {
            msg: "Demasiados intentos en poco tiempo. Esperá unos segundos.",
          },
        },
        oldData: { email: "admin@dentalclinic.com" },
      });
    });
  });
});
