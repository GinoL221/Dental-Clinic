import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "../../../lib/api.js";
import { createMockEvent } from "../../../test/mockFactory.js";

vi.mock("../../../lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Logout Route Server Load & Action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("load() redirects 303 to / without deleting auth cookies (prevents GET logout CSRF)", () => {
    const cookies = { delete: vi.fn() };
    const event = createMockEvent({
      cookies,
      locals: { authToken: "active-jwt" },
    });

    let thrown;
    try {
      load(event);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toMatchObject({ status: 303, location: "/" });
    expect(cookies.delete).not.toHaveBeenCalled();
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  it("actions.default calls POST /api/auth/logout, deletes auth cookies, and redirects 303 to /", async () => {
    const cookies = {
      delete: vi.fn(),
      get: vi.fn(() => "active-jwt"),
    };
    const event = createMockEvent({
      cookies,
      locals: { authToken: "active-jwt" },
    });

    vi.mocked(api.apiFetch).mockResolvedValue(null);

    await expect(actions.default(event)).rejects.toMatchObject({
      status: 303,
      location: "/",
    });

    expect(api.apiFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer active-jwt" },
    });
    expect(cookies.delete).toHaveBeenCalledWith("authToken", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userRole", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userEmail", { path: "/" });
  });

  it("actions.default still clears local cookies when backend logout fails", async () => {
    const cookies = {
      delete: vi.fn(),
      get: vi.fn(() => "expired-jwt"),
    };
    const event = createMockEvent({
      cookies,
      locals: { authToken: "expired-jwt" },
    });

    vi.mocked(api.apiFetch).mockRejectedValue(new Error("Unauthorized"));

    await expect(actions.default(event)).rejects.toMatchObject({
      status: 303,
      location: "/",
    });

    expect(cookies.delete).toHaveBeenCalledWith("authToken", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userRole", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userEmail", { path: "/" });
  });
});
