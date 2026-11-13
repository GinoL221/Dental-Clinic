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

  /**
   * Status-change contract (P-6c): the PUT /api/appointments/{id} DTO
   * (AppointmentRequestDTO) has NO status field, so the action performs a
   * second PATCH /api/appointments/{id}/status request after a successful PUT
   * — the same endpoint the dashboard's updateStatus action uses
   * (backend/src/main/java/com/dh/dentalClinicMVC/controller/
   * AppointmentController.java:253-...).
   */
  describe("actions.default with a status change (PATCH-after-PUT)", () => {
    /** @param {string} status */
    function formWithStatus(status) {
      const formData = new URLSearchParams();
      formData.append("patientId", "1");
      formData.append("dentistId", "2");
      formData.append("appointmentDate", "2026-07-07");
      formData.append("appointmentTime", "10:00");
      formData.append("description", "Routine Checkup");
      if (status) formData.append("status", status);
      return formData;
    }

    /** @param {URLSearchParams} formData */
    function eventWithForm(formData) {
      return createMockEvent({
        params: { id: "1" },
        request: { formData: vi.fn().mockResolvedValue(formData) },
        locals: { user: { id: 1 }, authToken: "mock-token" },
      });
    }

    it("PUTs the appointment data and then PATCHes the new status", async () => {
      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce({ id: 1, status: "SCHEDULED" })
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 1, status: "IN_PROGRESS" });

      await expect(
        actions.default(eventWithForm(formWithStatus("IN_PROGRESS"))),
      ).rejects.toMatchObject({ status: 303, location: "/appointments" });

      expect(api.apiFetch).toHaveBeenCalledWith("/api/appointments/1", {
        headers: { Authorization: "Bearer mock-token" },
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
      expect(api.apiFetch).toHaveBeenCalledWith("/api/appointments/1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
    });

    it("rejects an invalid transition before touching the backend", async () => {
      vi.mocked(api.apiFetch).mockResolvedValueOnce({
        id: 1,
        status: "COMPLETED",
      });

      const result = await actions.default(
        eventWithForm(formWithStatus("IN_PROGRESS")),
      );

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Completada"),
        oldData: expect.any(Object),
      });
      // Only the GET happened: neither PUT nor PATCH was called.
      expect(api.apiFetch).toHaveBeenCalledTimes(1);
    });

    it("reports a partial failure when the PATCH fails after a successful PUT", async () => {
      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce({ id: 1, status: "SCHEDULED" })
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(
          Object.assign(new Error("Transición de estado inválida"), {
            status: 409,
          }),
        );

      const result = await actions.default(
        eventWithForm(formWithStatus("COMPLETED")),
      );

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Transición de estado inválida"),
        oldData: expect.any(Object),
      });
    });

    it("skips the status PATCH when the submitted status equals the current one", async () => {
      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce({ id: 1, status: "SCHEDULED" })
        .mockResolvedValueOnce({ id: 1 });

      await expect(
        actions.default(eventWithForm(formWithStatus("SCHEDULED"))),
      ).rejects.toMatchObject({ status: 303, location: "/appointments" });

      expect(api.apiFetch).toHaveBeenCalledTimes(2);
    });

    it("skips the status GET entirely when no status field is submitted", async () => {
      vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });

      await expect(
        actions.default(eventWithForm(formWithStatus(""))),
      ).rejects.toMatchObject({ status: 303, location: "/appointments" });

      expect(api.apiFetch).toHaveBeenCalledTimes(1);
      expect(api.apiFetch).toHaveBeenCalledWith(
        "/api/appointments/1",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });
});
