import { describe, it, expect, vi } from "vitest";
import {
  formatLocalDate,
  getStatusLabel,
  getStatusClass,
  generateAppointmentsCsv,
  exportAppointmentsCsv,
  fieldErrorFor,
  usefulErrorMessage,
} from "./formatters.js";

describe("formatters", () => {
  describe("formatLocalDate", () => {
    it("formats YYYY-MM-DD to DD/MM/YYYY", () => {
      expect(formatLocalDate("2026-11-11")).toBe("11/11/2026");
      expect(formatLocalDate("2024-01-05")).toBe("05/01/2024");
    });

    it("returns empty string on falsy input", () => {
      expect(formatLocalDate("")).toBe("");
      expect(formatLocalDate(null)).toBe("");
      expect(formatLocalDate(undefined)).toBe("");
    });

    it("returns original string if format is not 3 parts", () => {
      expect(formatLocalDate("invalid")).toBe("invalid");
      expect(formatLocalDate("2026/11")).toBe("2026/11");
    });
  });

  describe("getStatusLabel", () => {
    it("returns Spanish translation for known statuses", () => {
      expect(getStatusLabel("SCHEDULED")).toBe("Programada");
      expect(getStatusLabel("IN_PROGRESS")).toBe("En curso");
      expect(getStatusLabel("COMPLETED")).toBe("Completada");
      expect(getStatusLabel("CANCELLED")).toBe("Cancelada");
      expect(getStatusLabel("CANCELED")).toBe("Cancelada");
    });

    it("returns original string for unknown statuses", () => {
      expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getStatusClass", () => {
    it("returns project status chip classes for known statuses", () => {
      expect(getStatusClass("SCHEDULED")).toBe("status-scheduled");
      expect(getStatusClass("IN_PROGRESS")).toBe("status-in-progress");
      expect(getStatusClass("COMPLETED")).toBe("status-completed");
      expect(getStatusClass("CANCELLED")).toBe("status-cancelled");
      expect(getStatusClass("CANCELED")).toBe("status-cancelled");
    });

    it("defaults to the neutral status chip for unknown statuses", () => {
      expect(getStatusClass("OTHER")).toBe("status-neutral");
    });
  });

  describe("generateAppointmentsCsv", () => {
    it("returns empty string if items is empty or null", () => {
      expect(generateAppointmentsCsv([])).toBe("");
      expect(generateAppointmentsCsv(/** @type {any} */ (null))).toBe("");
    });

    it("generates CSV with header and escaped fields", () => {
      const items = [
        {
          id: 1,
          patientName: "Juan Perez",
          dentistName: 'Dra. "Maria" Gomez',
          date: "2026-11-11",
          time: "10:00",
          status: "SCHEDULED",
        },
      ];

      const csv = generateAppointmentsCsv(items);
      const lines = csv.split("\r\n");
      expect(lines[0]).toBe("id,patientName,dentistName,date,time,status");
      expect(lines[1]).toBe(
        '"1","Juan Perez","Dra. ""Maria"" Gomez","2026-11-11","10:00","SCHEDULED"',
      );
    });
  });

  describe("fieldErrorFor", () => {
    it("returns the message for a field present in fieldErrors", () => {
      expect(
        fieldErrorFor({ email: "El email ya está registrado" }, "email"),
      ).toBe("El email ya está registrado");
      expect(
        fieldErrorFor(
          { "address.street": "La calle es requerida" },
          "address.street",
        ),
      ).toBe("La calle es requerida");
    });

    it("returns undefined for a field not present", () => {
      expect(
        fieldErrorFor({ email: "El email debe ser válido" }, "firstName"),
      ).toBeUndefined();
    });

    it("returns undefined for missing, null or non-object fieldErrors", () => {
      expect(fieldErrorFor(undefined, "email")).toBeUndefined();
      expect(fieldErrorFor(null, "email")).toBeUndefined();
      expect(
        fieldErrorFor(/** @type {any} */ ("oops"), "email"),
      ).toBeUndefined();
    });

    it("returns undefined for empty or non-string messages", () => {
      expect(fieldErrorFor({ email: "" }, "email")).toBeUndefined();
      expect(
        fieldErrorFor(/** @type {any} */ ({ email: 42 }), "email"),
      ).toBeUndefined();
    });
  });

  describe("usefulErrorMessage", () => {
    it("returns true for real backend messages", () => {
      expect(usefulErrorMessage("El email ya está registrado")).toBe(true);
      expect(usefulErrorMessage("El DNI ya está registrado")).toBe(true);
    });

    it("returns false for generic HTTP error fallbacks", () => {
      expect(usefulErrorMessage("HTTP error! status: 409")).toBe(false);
      expect(usefulErrorMessage("HTTP error! status: 500")).toBe(false);
    });

    it("returns false for empty or missing messages", () => {
      expect(usefulErrorMessage("")).toBe(false);
      expect(usefulErrorMessage(null)).toBe(false);
      expect(usefulErrorMessage(undefined)).toBe(false);
    });
  });

  describe("exportAppointmentsCsv", () => {
    it("returns false if items is empty", () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      expect(exportAppointmentsCsv([])).toBe(false);
      expect(alertMock).toHaveBeenCalledWith("No hay datos para exportar");
      alertMock.mockRestore();
    });

    it("initiates download when items exist", () => {
      const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});

      const items = [
        {
          id: 1,
          patientName: "Test",
          dentistName: "Doc",
          date: "2026-11-11",
          time: "10:00",
          status: "COMPLETED",
        },
      ];

      expect(exportAppointmentsCsv(items)).toBe(true);
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });
});
