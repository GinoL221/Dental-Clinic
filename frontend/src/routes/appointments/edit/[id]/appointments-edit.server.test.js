import { describe, it, expect, vi, beforeEach } from "vitest";
import { load, actions } from "./+page.server.js";
import * as api from "../../../../lib/api.js";
import { createMockEvent } from "../../../../test/mockFactory.js";

vi.mock("../../../../lib/api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("Appointments Edit Route Server Actions & Loader", () => {
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

    it("should load appointment, patients, and dentists lists if authenticated", async () => {
      const mockAppointment = {
        id: 1,
        patientId: 10,
        dentistId: 20,
        date: "2026-07-07",
        time: "10:00",
        description: "Checkup",
      };
      const mockPatients = [{ id: 10, firstName: "John" }];
      const mockDentists = [{ id: 20, firstName: "Dr. Jane" }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce(mockDentists);

      const event = createMockEvent({
        params: { id: "1" },
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      const result = await load(event);
      expect(result).toEqual({
        appointment: mockAppointment,
        patients: mockPatients,
        dentists: mockDentists,
      });

      expect(api.apiFetch).toHaveBeenNthCalledWith(1, "/api/appointments/1", {
        headers: { Authorization: "Bearer mock-token" },
      });
    });
  });

  describe("actions.default", () => {
    it("should update appointment successfully and redirect to /appointments", async () => {
      const formData = new URLSearchParams();
      formData.append("patientId", "1");
      formData.append("dentistId", "2");
      formData.append("appointmentDate", "2026-07-07");
      formData.append("appointmentTime", "10:00");
      formData.append("description", "Routine Checkup");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: "/appointments",
      });

      expect(api.apiFetch).toHaveBeenCalledWith("/api/appointments/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          patientId: 1,
          dentistId: 2,
          date: "2026-07-07",
          time: "10:00",
          description: "Routine Checkup",
        }),
      });
    });

    it("should surface the backend error message, falling back for HTTP errors", async () => {
      const formData = new URLSearchParams();
      formData.append("patientId", "1");
      formData.append("dentistId", "2");
      formData.append("appointmentDate", "2026-07-07");
      formData.append("appointmentTime", "10:00");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const event = createMockEvent({
        params: { id: "1" },
        request,
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });

      vi.mocked(api.apiFetch).mockRejectedValueOnce(
        Object.assign(new Error("El odontólogo no existe"), { status: 404 }),
      );

      const result = await actions.default(event);
      expect(result).toEqual({
        success: false,
        error: "El odontólogo no existe",
        oldData: expect.any(Object),
      });

      vi.mocked(api.apiFetch).mockRejectedValueOnce(
        Object.assign(new Error("HTTP error! status: 500"), { status: 500 }),
      );

      const fallbackResult = await actions.default(event);
      expect(fallbackResult).toEqual({
        success: false,
        error:
          "Ya existe una cita en esa fecha y hora o los datos son inválidos.",
        oldData: expect.any(Object),
      });
    });

    it("should pass through fieldErrors from the API validation error", async () => {
      const formData = new URLSearchParams();
      formData.append("patientId", "1");
      formData.append("dentistId", "2");
      formData.append("appointmentDate", "07/07/2026");
      formData.append("appointmentTime", "25:00");

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const error = Object.assign(new Error("HTTP error! status: 400"), {
        status: 400,
        fieldErrors: {
          date: "Formato de fecha inválido (yyyy-MM-dd)",
          time: "Formato de hora inválido (HH:mm)",
          description: "La descripción no puede exceder 500 caracteres",
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
          date: "Formato de fecha inválido (yyyy-MM-dd)",
          time: "Formato de hora inválido (HH:mm)",
          description: "La descripción no puede exceder 500 caracteres",
        },
        oldData: expect.any(Object),
      });
    });
  });
});
