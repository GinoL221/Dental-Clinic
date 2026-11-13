import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "$lib/api.js";
import { createMockEvent } from "../../../test/mockFactory.js";

vi.mock("$lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Change Password Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("load()", () => {
    it("should redirect to /login if unauthenticated", async () => {
      const event = createMockEvent({ locals: {} });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });

    it("should return user data when authenticated", async () => {
      const user = {
        id: 1,
        firstName: "Carlos",
        lastName: "Gomez",
        email: "carlos@test.com",
        role: "ADMIN",
        mustChangePassword: true,
      };
      const event = createMockEvent({
        locals: { user, authToken: "valid-token" },
      });
      const result = await load(event);
      expect(result).toEqual({ user });
    });
  });

  describe("actions.default", () => {
    it("should redirect to /login if unauthenticated", async () => {
      const event = createMockEvent({ locals: {} });
      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });

    it("should fail if currentPassword is missing", async () => {
      const formData = new URLSearchParams();
      formData.append("newPassword", "newSecret123!");
      formData.append("confirmPassword", "newSecret123!");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 1, role: "PATIENT" },
          authToken: "valid-token",
        },
      });

      const result = await actions.default(event);
      expect(result).toMatchObject({
        status: 400,
        data: { error: "Tenés que ingresar tu contraseña actual o temporal." },
      });
    });

    it("should fail if newPassword is too short", async () => {
      const formData = new URLSearchParams();
      formData.append("currentPassword", "oldSecret123!");
      formData.append("newPassword", "123");
      formData.append("confirmPassword", "123");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 1, role: "PATIENT" },
          authToken: "valid-token",
        },
      });

      const result = await actions.default(event);
      expect(result).toMatchObject({
        status: 400,
        data: {
          error: "La nueva contraseña debe tener al menos 6 caracteres.",
        },
      });
    });

    it("should fail if confirmation does not match", async () => {
      const formData = new URLSearchParams();
      formData.append("currentPassword", "oldSecret123!");
      formData.append("newPassword", "newSecret123!");
      formData.append("confirmPassword", "differentSecret123!");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 1, role: "PATIENT" },
          authToken: "valid-token",
        },
      });

      const result = await actions.default(event);
      expect(result).toMatchObject({
        status: 400,
        data: {
          error: "La nueva contraseña y su confirmación no coinciden.",
        },
      });
    });

    it("should fail if new password is identical to current password", async () => {
      const formData = new URLSearchParams();
      formData.append("currentPassword", "sameSecret123!");
      formData.append("newPassword", "sameSecret123!");
      formData.append("confirmPassword", "sameSecret123!");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 1, role: "PATIENT" },
          authToken: "valid-token",
        },
      });

      const result = await actions.default(event);
      expect(result).toMatchObject({
        status: 400,
        data: {
          error:
            "La nueva contraseña debe ser diferente a la contraseña actual.",
        },
      });
    });

    it("should change password successfully and redirect to /dashboard for ADMIN", async () => {
      const formData = new URLSearchParams();
      formData.append("currentPassword", "oldTempSecret!");
      formData.append("newPassword", "newSecurePass123!");
      formData.append("confirmPassword", "newSecurePass123!");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 1, role: "ADMIN" },
          authToken: "valid-token",
        },
      });

      vi.mocked(api.apiFetch).mockResolvedValue({});

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/dashboard",
      });

      expect(api.apiFetch).toHaveBeenCalledWith("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          currentPassword: "oldTempSecret!",
          newPassword: "newSecurePass123!",
        }),
      });
    });

    it("should change password successfully and redirect to /appointments for PATIENT", async () => {
      const formData = new URLSearchParams();
      formData.append("currentPassword", "oldTempSecret!");
      formData.append("newPassword", "newSecurePass123!");
      formData.append("confirmPassword", "newSecurePass123!");

      const event = createMockEvent({
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: {
          user: { id: 2, role: "PATIENT" },
          authToken: "valid-token",
        },
      });

      vi.mocked(api.apiFetch).mockResolvedValue({});

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/appointments",
      });
    });
  });
});
