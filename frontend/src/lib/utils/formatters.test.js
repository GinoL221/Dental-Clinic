import { describe, it, expect, vi } from "vitest";
import {
  formatLocalDate,
  getStatusLabel,
  getStatusClass,
  generateAppointmentsCsv,
  exportAppointmentsCsv,
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
    it("returns badge classes for known statuses", () => {
      expect(getStatusClass("SCHEDULED")).toBe("bg-secondary");
      expect(getStatusClass("IN_PROGRESS")).toBe("bg-info");
      expect(getStatusClass("COMPLETED")).toBe("bg-success");
      expect(getStatusClass("CANCELLED")).toBe("bg-danger");
      expect(getStatusClass("CANCELED")).toBe("bg-danger");
    });

    it("defaults to bg-secondary for unknown statuses", () => {
      expect(getStatusClass("OTHER")).toBe("bg-secondary");
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
