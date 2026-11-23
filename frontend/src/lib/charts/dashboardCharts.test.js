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

    it("configures integer-only Y axis ticks for bar count charts", () => {
      const container = document.createElement("div");
      createBarChart(container, ["Programada"], [1], "#0dcaf0");

      const opts = mockUPlotConstructor.mock.calls[0][0];
      const yAxis = opts.axes[1];

      expect(yAxis.scale).toBe("y");
      expect(Array.isArray(yAxis.incrs)).toBe(true);
      expect(yAxis.incrs[0]).toBe(1);
      expect(
        yAxis.incrs.every(
          (/** @type {number} */ v) => Number.isInteger(v) && v >= 1,
        ),
      ).toBe(true);
      expect(typeof yAxis.values).toBe("function");
      expect(yAxis.values(null, [0, 0.2, 0.4, 1])).toEqual(["0", "", "", "1"]);
      expect(opts.scales.y.auto).not.toBe(false);
      expect(opts.scales.y.range(null, 0, 0)).toEqual([0, 1]);
      expect(opts.scales.y.range(null, 0, 1)).toEqual([0, 1]);
      expect(opts.scales.y.range(null, 0, 12)).toEqual([0, 12]);
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
              stroke: "rgb(14, 116, 144)",
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

    it("configures integer-only Y axis incrs and values for small appointment counts", () => {
      const container = document.createElement("div");
      const stats = [
        { monthName: "Enero", appointmentCount: 0 },
        { monthName: "Febrero", appointmentCount: 1 },
      ];

      createMonthlyLineChart(container, stats);
      const opts = mockUPlotConstructor.mock.calls[0][0];
      const yAxis = opts.axes[1];

      expect(yAxis.scale).toBe("y");
      expect(Array.isArray(yAxis.incrs)).toBe(true);
      expect(yAxis.incrs[0]).toBe(1);
      expect(
        yAxis.incrs.every(
          (/** @type {number} */ v) => Number.isInteger(v) && v >= 1,
        ),
      ).toBe(true);
      expect(typeof yAxis.values).toBe("function");
      expect(yAxis.values(null, [0, 0.2, 0.4, 0.6, 0.8, 1])).toEqual([
        "0",
        "",
        "",
        "",
        "",
        "1",
      ]);
      expect(opts.scales.y.auto).not.toBe(false);
      expect(opts.scales.y.range(null, 0, 0)).toEqual([0, 1]);
      expect(opts.scales.y.range(null, 0, 1)).toEqual([0, 1]);
      expect(opts.scales.y.range(null, 0, 12)).toEqual([0, 12]);
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
              stroke: "rgb(43, 108, 176)",
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
    it("creates dentist breakdown chart with tokenized info-dark color", () => {
      const container = document.createElement("div");
      const breakdown = [{ dentistName: "Dra. Gomez", count: 12 }];

      const chart = createDentistChart(container, breakdown);
      expect(chart).toBe(mockUPlotInstance);
      expect(mockUPlotConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          series: [
            {},
            expect.objectContaining({
              stroke: "rgb(14, 116, 144)",
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
