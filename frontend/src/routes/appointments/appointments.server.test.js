import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "../../lib/api.js";
import { createMockEvent } from "../../test/mockFactory.js";

vi.mock("../../lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Appointments Route Server Loader & Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("load()", () => {
    it("should redirect to /login if user is not authenticated", async () => {
      const event = createMockEvent({ locals: {} });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });

    it("should load appointments list if authenticated", async () => {
      const mockAppointments = [
        { id: 1, date: "2026-07-07T10:00:00", description: "Cleaning" },
      ];
      const mockPatients = [{ id: 10, firstName: "John" }];
      const mockDentists = [{ id: 20, firstName: "Dr. Jane" }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockAppointments)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce(mockDentists);

      const event = createMockEvent({
        locals: {
          user: { id: 1, email: "admin@clinic.com" },
          authToken: "mock-token",
        },
      });

      const result = await load(event);
      expect(result).toEqual({
        appointments: mockAppointments,
        patients: mockPatients,
        dentists: mockDentists,
        user: { id: 1, email: "admin@clinic.com" },
      });
      expect(api.apiFetch).toHaveBeenNthCalledWith(
        1,
        "/api/appointments/search",
        {
          headers: { Authorization: "Bearer mock-token" },
        },
      );
    });

    it("should resolve current PATIENT name from locals.user without calling /api/patients", async () => {
      const mockAppointments = [
        {
          id: 10,
          patientId: 6,
          dentistId: 2,
          date: "2026-07-07",
          time: "10:00",
          description: "Control",
          status: "SCHEDULED",
        },
      ];
      const mockDentists = [{ id: 2, firstName: "Ana", lastName: "García" }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce({ content: mockAppointments })
        .mockResolvedValueOnce(mockDentists);

      const patientUser = {
        id: 6,
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan.perez@email.com",
        role: "PATIENT",
      };

      const event = createMockEvent({
        locals: {
          user: patientUser,
          authToken: "patient-token",
        },
      });

      const result = await load(event);
      expect(result).toEqual({
        appointments: mockAppointments,
        patients: [{ id: 6, firstName: "Juan", lastName: "Pérez" }],
        dentists: mockDentists,
        user: patientUser,
      });
      expect(api.apiFetch).toHaveBeenCalledTimes(2);
      expect(api.apiFetch).toHaveBeenNthCalledWith(
        1,
        "/api/appointments/search",
        { headers: { Authorization: "Bearer patient-token" } },
      );
      expect(api.apiFetch).toHaveBeenNthCalledWith(2, "/api/dentists", {
        headers: { Authorization: "Bearer patient-token" },
      });
    });

    it("should redirect to /login if authToken is missing even when user is present", async () => {
      const event = createMockEvent({
        locals: { user: { id: 1, email: "admin@clinic.com" }, authToken: null },
      });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: "/login",
      });
    });
  });

  describe("actions.delete", () => {
    it("should delete an appointment successfully", async () => {
      const formData = new URLSearchParams();
      formData.append("id", "1");
      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockResolvedValue("Appointment deleted");

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1 },
          authToken: "mock-token",
        },
      });

      const result = await actions.delete(event);
      expect(result).toEqual({ success: true });
      expect(api.apiFetch).toHaveBeenCalledWith("/api/appointments/1", {
        method: "DELETE",
        headers: { Authorization: "Bearer mock-token" },
      });
    });

    it("should return structured failure with fallback message when delete fails with generic HTTP error", async () => {
      const formData = new URLSearchParams();
      formData.append("id", "99");
      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockRejectedValue(
        Object.assign(new Error("HTTP error! status: 500"), { status: 500 }),
      );

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1, role: "ADMIN" },
          authToken: "mock-token",
        },
      });

      const result = await actions.delete(event);
      expect(result).toEqual({
        success: false,
        error: "Error al eliminar el turno.",
      });
    });

    it("should surface useful backend error message when delete fails", async () => {
      const formData = new URLSearchParams();
      formData.append("id", "99");
      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockRejectedValue(
        Object.assign(new Error("Turno no encontrado con ID: 99"), {
          status: 404,
        }),
      );

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1, role: "ADMIN" },
          authToken: "mock-token",
        },
      });

      const result = await actions.delete(event);
      expect(result).toEqual({
        success: false,
        error: "Turno no encontrado con ID: 99",
      });
    });
  });
});
