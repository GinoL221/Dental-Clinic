import test from "node:test";
import assert from "node:assert/strict";
import {
  installCanvasAxisObserver,
  installCanvasAxisObserverInPage,
} from "./fixtures/canvas-axis-observer.js";
import { DashboardPage } from "./pages/dashboard.js";

/** @returns {any} */
function makeFixture() {
  /** @type {Array<(timestamp: number) => void>} */
  const frames = [];
  /** @type {Array<{ method: string, receiver: any, args: any[] }>} */
  const calls = [];
  /** @type {Map<string, any>} */
  const charts = new Map();
  /** @type {any} */
  const prototype = {
    fillText(/** @type {any[]} */ ...args) {
      calls.push({ method: "fillText", receiver: this, args });
    },
    clearRect(/** @type {any[]} */ ...args) {
      calls.push({ method: "clearRect", receiver: this, args });
    },
    getTransform() {
      return this.matrix || { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    },
  };
  /** @type {any} */
  const root = {
    defaultView: { CanvasRenderingContext2D: { prototype } },
    querySelectorAll(/** @type {string} */ selector) {
      return selector === "canvas"
        ? [...charts.values()].flatMap((chart) => chart.canvases)
        : [];
    },
    querySelector(/** @type {string} */ selector) {
      return charts.get(selector.slice(1)) || null;
    },
  };
  /** @param {string} id */
  function addChart(id) {
    /** @type {any} */
    const chart = {
      id,
      canvases: [],
      querySelectorAll: (/** @type {string} */ selector) =>
        selector === ".uplot canvas" ? chart.canvases : [],
    };
    const plot = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 600,
        height: 350,
      }),
      closest: () => chart,
      querySelectorAll: (/** @type {string} */ selector) =>
        selector === ".u-axis"
          ? [
              {
                getBoundingClientRect: () => ({
                  left: 10,
                  top: 300,
                  width: 600,
                  height: 70,
                }),
              },
              {
                getBoundingClientRect: () => ({
                  left: 10,
                  top: 20,
                  width: 60,
                  height: 310,
                }),
              },
            ]
          : [],
    };
    function addCanvas() {
      /** @type {any} */
      const canvas = {
        width: 1200,
        height: 700,
        getBoundingClientRect: () => ({
          left: 10,
          top: 20,
          width: 600,
          height: 350,
        }),
        closest: (/** @type {string} */ selector) =>
          selector === ".uplot" ? plot : selector === "[id]" ? chart : null,
      };
      const context = Object.create(prototype);
      context.canvas = canvas;
      canvas.getContext = () => context;
      chart.canvases.push(canvas);
      return context;
    }
    charts.set(id, chart);
    return { chart, addCanvas };
  }
  return {
    root,
    frames,
    calls,
    addChart,
    install: () =>
      installCanvasAxisObserver(root, (callback) => frames.push(callback)),
  };
}

/** @param {any} context @param {string} text @param {number} x @param {number} y */
function draw(context, text, x, y) {
  Reflect.apply(context.fillText, context, [text, x, y, 80]);
}

/** @param {Array<(timestamp: number) => void>} frames */
function finishFrame(frames) {
  frames.splice(0).forEach((frame) => frame(0));
}

test("browser and unit tests use the same canvas observer implementation", () => {
  assert.equal(installCanvasAxisObserverInPage, installCanvasAxisObserver);
});

test("captures bottom x-axis text by plot/axis geometry and device-pixel ratio, not y ticks", () => {
  const fixture = makeFixture();
  const { addCanvas } = fixture.addChart("statusChart");
  const context = addCanvas();
  const original =
    fixture.root.defaultView.CanvasRenderingContext2D.prototype.fillText;
  const originalClear =
    fixture.root.defaultView.CanvasRenderingContext2D.prototype.clearRect;
  const observer = fixture.install();
  draw(context, "Y tick", 60, 550); // y-axis value remains above the bottom x-axis box
  draw(context, "Programada", 300, 650); // maps into the bottom x-axis at DPR 2
  finishFrame(fixture.frames);
  assert.deepEqual(observer.completedLabels("statusChart"), ["Programada"]);
  assert.deepEqual(fixture.calls.at(-1).args, ["Programada", 300, 650, 80]);
  assert.equal(fixture.calls.at(-1).receiver, context);
  observer.reset();
  assert.equal(
    fixture.root.defaultView.CanvasRenderingContext2D.prototype.fillText,
    original,
  );
  assert.equal(
    fixture.root.defaultView.CanvasRenderingContext2D.prototype.clearRect,
    originalClear,
  );
});

test("DashboardPage resets the observer through the provider API installed in the browser", async () => {
  const fixture = makeFixture();
  const { addCanvas } = fixture.addChart("statusChart");
  const context = addCanvas();
  const observer = fixture.install();
  draw(context, "Programada", 300, 650);
  finishFrame(fixture.frames);
  assert.equal(fixture.root.defaultView.__e2eCanvasAxisObserver, observer);
  let resetChart;
  const reset = observer.reset;
  observer.reset = (/** @type {string} */ chartId) => {
    resetChart = chartId;
    reset(chartId);
  };

  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fixture.root.defaultView,
  });
  try {
    /** @type {any} */
    const page = {
      waitForFunction: async (
        /** @type {(id: string) => boolean} */ predicate,
        /** @type {string} */ id,
      ) => predicate(id),
      evaluate: async (
        /** @type {(id: string) => string[]} */ operation,
        /** @type {string} */ id,
      ) => operation(id),
    };
    const labels = await new DashboardPage(page).xAxisLabels("statusChart");
    assert.deepEqual(labels, ["Programada"]);
    assert.equal(resetChart, "statusChart");
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    observer.reset();
  }
});

test("maps transformed fillText coordinates through the canvas DPR to the actual x-axis box", () => {
  const fixture = makeFixture();
  const { addCanvas } = fixture.addChart("statusChart");
  const context = addCanvas();
  context.matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 20 };
  const observer = fixture.install();
  draw(context, "Transformed month", 300, 550);
  finishFrame(fixture.frames);
  assert.deepEqual(observer.completedLabels("statusChart"), [
    "Transformed month",
  ]);
  observer.reset();
});

test("keeps per-canvas cycles isolated, ignores other charts, and excludes removed plot canvases", () => {
  const fixture = makeFixture();
  const status = fixture.addChart("statusChart");
  const oldStatusContext = status.addCanvas();
  const otherChart = fixture.addChart("dentistChart");
  const otherContext = otherChart.addCanvas();
  const observer = fixture.install();

  draw(oldStatusContext, "Old status", 300, 650);
  draw(otherContext, "Dentist label", 300, 650);
  finishFrame(fixture.frames);
  assert.deepEqual(observer.completedLabels("statusChart"), ["Old status"]);
  assert.deepEqual(observer.completedLabels("dentistChart"), ["Dentist label"]);

  const newStatusContext = status.addCanvas();
  status.chart.canvases.splice(0, 1);
  oldStatusContext.clearRect(0, 0, 1200, 700);
  assert.deepEqual(fixture.calls.at(-1).args, [0, 0, 1200, 700]);
  assert.equal(fixture.calls.at(-1).receiver, oldStatusContext);
  draw(newStatusContext, "New status", 300, 650);
  finishFrame(fixture.frames);
  assert.deepEqual(observer.completedLabels("statusChart"), ["New status"]);
  assert.deepEqual(observer.completedLabels("dentistChart"), ["Dentist label"]);
  observer.reset("statusChart");
  assert.equal(observer.completedLabels("statusChart"), undefined);
  assert.deepEqual(observer.completedLabels("dentistChart"), ["Dentist label"]);
});
