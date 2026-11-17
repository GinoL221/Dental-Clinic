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

    it("should load dentist details and specialties if authenticated", async () => {
      const mockDentist = {
        id: 1,
        firstName: "Jane",
        lastName: "Smith",
        registrationNumber: "D999",
        specialties: [{ id: 10, name: "Ortodoncia" }],
      };
      const mockSpecialties = [
        { id: 10, name: "Ortodoncia" },
        { id: 11, name: "Endodoncia" },
      ];
      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockDentist)
        .mockResolvedValueOnce(mockSpecialties);

      const event = createMockEvent({
        params: { id: "1" },
        locals: { user: { id: 1, role: "ADMIN" }, authToken: "mock-token" },
      });

      const result = await load(event);
      expect(result).toEqual({
        dentist: mockDentist,
        specialties: mockSpecialties,
        user: { id: 1, role: "ADMIN" },
      });
      expect(api.apiFetch).toHaveBeenCalledWith("/api/dentists/1", {
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(api.apiFetch).toHaveBeenCalledWith("/api/specialties", {
        headers: { Authorization: "Bearer mock-token" },
      });
    });
  });

  describe("actions.update", () => {
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

      await expect(actions.update(event)).rejects.toMatchObject({
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

      const result = await actions.update(event);
      expect(result).toEqual({
        success: false,
        error: "El email ya está registrado",
        oldData: expect.any(Object),
      });

      vi.mocked(api.apiFetch).mockRejectedValueOnce(
        Object.assign(new Error("HTTP error! status: 500"), { status: 500 }),
      );

      const fallbackResult = await actions.update(event);
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

      const result = await actions.update(event);
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

  describe("specialty actions", () => {
    it("assignSpecialty assigns specialty to dentist via SpecialtyController endpoint", async () => {
      const formData = new URLSearchParams();
      formData.append("specialtyId", "2");
      const request = { formData: vi.fn().mockResolvedValue(formData) };
      vi.mocked(api.apiFetch).mockResolvedValue(null);

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1, role: "ADMIN" }, authToken: "mock-token" },
      });

      const result = await actions.assignSpecialty(event);
      expect(result).toEqual({ specialtySuccess: "Especialidad asignada" });
      expect(api.apiFetch).toHaveBeenCalledWith(
        "/api/specialties/dentists/1/specialties/2",
        {
          method: "POST",
          headers: { Authorization: "Bearer mock-token" },
        },
      );
    });

    it("removeSpecialty removes specialty from dentist", async () => {
      const formData = new URLSearchParams();
      formData.append("specialtyId", "2");
      const request = { formData: vi.fn().mockResolvedValue(formData) };
      vi.mocked(api.apiFetch).mockResolvedValue(null);

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1, role: "ADMIN" }, authToken: "mock-token" },
      });

      const result = await actions.removeSpecialty(event);
      expect(result).toEqual({ specialtySuccess: "Especialidad quitada" });
      expect(api.apiFetch).toHaveBeenCalledWith(
        "/api/specialties/dentists/1/specialties/2",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer mock-token" },
        },
      );
    });

    it("createSpecialty creates specialty and assigns it to dentist", async () => {
      const formData = new URLSearchParams();
      formData.append("name", "Implantología");
      formData.append("description", "Implantes dentales");
      const request = { formData: vi.fn().mockResolvedValue(formData) };

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce({
          id: 9,
          name: "Implantología",
          description: "Implantes dentales",
        })
        .mockResolvedValueOnce(null);

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1, role: "ADMIN" }, authToken: "mock-token" },
      });

      const result = await actions.createSpecialty(event);
      expect(result).toEqual({
        specialtySuccess: "Especialidad creada y asignada",
      });
      expect(api.apiFetch).toHaveBeenNthCalledWith(1, "/api/specialties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          name: "Implantología",
          description: "Implantes dentales",
        }),
      });
      expect(api.apiFetch).toHaveBeenNthCalledWith(
        2,
        "/api/specialties/dentists/1/specialties/9",
        {
          method: "POST",
          headers: { Authorization: "Bearer mock-token" },
        },
      );
    });
  });
});
