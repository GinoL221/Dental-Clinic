import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "../../../../lib/api.js";
import { createMockEvent } from "../../../../test/mockFactory.js";

vi.mock("../../../../lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Dentist Edit Route Server Actions & Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("load()", () => {
    it("should redirect to /login if user is not authenticated", async () => {
      const event = createMockEvent({ params: { id: "1" }, locals: {} });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });

    it("should redirect to /login if authToken is missing even when user is present", async () => {
      const event = createMockEvent({
        params: { id: "1" },
        locals: { user: { id: 1 }, authToken: null },
      });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });

    it("should load dentist details if authenticated", async () => {
      const mockDentist = {
        id: 1,
        firstName: "Jane",
        lastName: "Smith",
        registrationNumber: "D999",
      };
      vi.mocked(api.apiFetch).mockResolvedValue(mockDentist);

      const event = createMockEvent({
        params: { id: "1" },
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      const result = await load(event);
      expect(result).toEqual({ dentist: mockDentist });
      expect(api.apiFetch).toHaveBeenCalledWith("/api/dentists/1", {
        headers: { Authorization: "Bearer mock-token" },
      });
    });
  });

  describe("actions.default", () => {
    it("should update dentist successfully and redirect to /dentists", async () => {
      const formData = new URLSearchParams();
      formData.append("firstName", "Jane");
      formData.append("lastName", "Smith");
      formData.append("email", "jane@smith.com");
      formData.append("registrationNumber", "D999");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockResolvedValue("Dentist updated");

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/dentists",
      });

      expect(api.apiFetch).toHaveBeenCalledWith("/api/dentists/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@smith.com",
          registrationNumber: "D999",
        }),
      });
    });

    it("should surface the backend error message, falling back for HTTP errors", async () => {
      const formData = new URLSearchParams();
      formData.append("firstName", "Jane");
      formData.append("lastName", "Smith");
      formData.append("email", "jane@smith.com");
      formData.append("registrationNumber", "12345");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      vi.mocked(api.apiFetch).mockRejectedValueOnce(
        Object.assign(new Error("El email ya está registrado"), {
          status: 409,
        }),
      );

      const result = await actions.default(event);
      expect(result).toEqual({
        success: false,
        error: "El email ya está registrado",
        oldData: expect.any(Object),
      });

      vi.mocked(api.apiFetch).mockRejectedValueOnce(
        Object.assign(new Error("HTTP error! status: 500"), { status: 500 }),
      );

      const fallbackResult = await actions.default(event);
      expect(fallbackResult).toEqual({
        success: false,
        error: "Error al actualizar el odontólogo.",
        oldData: expect.any(Object),
      });
    });

    it("should pass through fieldErrors from the API validation error", async () => {
      const formData = new URLSearchParams();
      formData.append("firstName", "J");
      formData.append("email", "not-an-email");
      formData.append("registrationNumber", "-5");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const error = Object.assign(new Error("HTTP error! status: 400"), {
        status: 400,
        fieldErrors: {
          firstName: "El nombre debe tener al menos 2 caracteres",
          email: "El email debe ser válido",
          registrationNumber:
            "El número de matrícula debe ser un número positivo",
        },
      });
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      const result = await actions.default(event);
      expect(result).toEqual({
        success: false,
        fieldErrors: {
          firstName: "El nombre debe tener al menos 2 caracteres",
          email: "El email debe ser válido",
          registrationNumber:
            "El número de matrícula debe ser un número positivo",
        },
        oldData: expect.any(Object),
      });
    });
  });
});
