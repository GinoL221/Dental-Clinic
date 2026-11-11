import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createBarChart,
  createMonthlyLineChart,
  createStatusChart,
  createDentistChart,
  loadUPlot,
} from "./dashboardCharts.js";

describe("dashboardCharts", () => {
  /** @type {any} */
  let mockUPlotInstance;
  /** @type {any} */
  let mockUPlotConstructor;

  beforeEach(() => {
    mockUPlotInstance = {
      destroy: vi.fn(),
      setSize: vi.fn(),
    };

    mockUPlotConstructor = vi.fn(function () {
      return mockUPlotInstance;
    });
    mockUPlotConstructor.paths = {
      bars: vi.fn().mockReturnValue("mock-bars-path"),
      spline: vi.fn().mockReturnValue("mock-spline-path"),
    };

    // @ts-ignore
    globalThis.uPlot = mockUPlotConstructor;
    // @ts-ignore
    window.uPlot = mockUPlotConstructor;
  });

  afterEach(() => {
    // @ts-ignore
    delete globalThis.uPlot;
    // @ts-ignore
    delete window.uPlot;
  });

  describe("createBarChart", () => {
    it("returns null if container or data is missing", () => {
      const container = document.createElement("div");
      expect(createBarChart(container, [], [], "#000")).toBeNull();
      expect(
        createBarChart(/** @type {any} */ (null), ["A"], [1], "#000"),
      ).toBeNull();
    });

    it("creates a bar chart instance with correct config", () => {
      const container = document.createElement("div");
      const chart = createBarChart(container, ["A", "B"], [10, 20], "#0dcaf0");

      expect(chart).toBe(mockUPlotInstance);
      expect(mockUPlotConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 350,
          series: [
            {},
            expect.objectContaining({
              label: "Citas",
              stroke: "#0dcaf0",
              fill: "#0dcaf0",
            }),
          ],
        }),
        [
          [1, 2],
          [10, 20],
        ],
        container,
      );
    });
  });

  describe("createMonthlyLineChart", () => {
    it("returns null on empty or missing data", () => {
      const container = document.createElement("div");
      expect(createMonthlyLineChart(container, [])).toBeNull();
      expect(createMonthlyLineChart(container, undefined)).toBeNull();
    });

    it("creates spline chart from monthly stats", () => {
      const container = document.createElement("div");
      const stats = [
        { monthName: "Enero", appointmentCount: 15 },
        { monthName: "Febrero", appointmentCount: 25 },
      ];

      const chart = createMonthlyLineChart(container, stats);
      expect(chart).toBe(mockUPlotInstance);
      expect(mockUPlotConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 350,
          series: [
            {},
            expect.objectContaining({
              label: "Citas",
              stroke: "#0d6efd",
              paths: "mock-spline-path",
            }),
          ],
        }),
        [
          [1, 2],
          [15, 25],
        ],
        container,
      );
    });
  });

  describe("createStatusChart", () => {
    it("transforms status breakdown using getStatusLabel", () => {
      const container = document.createElement("div");
      const breakdown = [
        { status: "SCHEDULED", count: 5 },
        { status: "COMPLETED", count: 8 },
      ];
      const getStatusLabel = (/** @type {string} */ s) =>
        s === "SCHEDULED" ? "Programada" : s;

      const chart = createStatusChart(container, breakdown, getStatusLabel);
      expect(chart).toBe(mockUPlotInstance);
      expect(mockUPlotConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          series: [
            {},
            expect.objectContaining({
              stroke: "#0dcaf0",
            }),
          ],
        }),
        [
          [1, 2],
          [5, 8],
        ],
        container,
      );
    });
  });

  describe("createDentistChart", () => {
    it("creates dentist breakdown chart with #20c997", () => {
      const container = document.createElement("div");
      const breakdown = [{ dentistName: "Dra. Gomez", count: 12 }];

      const chart = createDentistChart(container, breakdown);
      expect(chart).toBe(mockUPlotInstance);
      expect(mockUPlotConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          series: [
            {},
            expect.objectContaining({
              stroke: "#20c997",
            }),
          ],
        }),
        [[1], [12]],
        container,
      );
    });
  });

  describe("loadUPlot", () => {
    it("resolves immediately if uPlot is already on window", async () => {
      await expect(loadUPlot()).resolves.toBeUndefined();
    });
  });
});
