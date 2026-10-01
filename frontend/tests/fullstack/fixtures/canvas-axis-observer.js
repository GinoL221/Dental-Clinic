// Test-only observer shared by Node contract tests and the browser E2E fixture.
/**
 * Install before navigation; a draw cycle belongs to one live canvas and is
 * complete only when its latest synchronous draw reaches the next animation frame.
 * @param {Document | any} root
 * @param {(callback: (timestamp: number) => void) => void} [schedule]
 */
export function installCanvasAxisObserver(
  root,
  schedule = (callback) => root.defaultView.requestAnimationFrame(callback),
) {
  const chartIds = ["statusChart", "dentistChart", "appointmentsChart"];
  const view = root.defaultView;
  const prototype = view.CanvasRenderingContext2D.prototype;
  const originalFillText = prototype.fillText;
  const originalClearRect = prototype.clearRect;
  /** @type {WeakMap<HTMLCanvasElement, { labels: string[], revision: number }>} */
  const cycles = new WeakMap();
  /** @type {WeakMap<HTMLCanvasElement, string[]>} */
  const completed = new WeakMap();

  /** @param {any} canvas */
  const chartForCanvas = (canvas) => {
    const plot = canvas.closest(".uplot");
    if (!plot) return null;
    for (const chartId of chartIds) {
      const chart = plot.closest(`#${chartId}`);
      if (chart) return { chartId, chart, plot };
    }
    return null;
  };

  /** @param {any} canvas @param {any} plot @param {number} x @param {number} y @param {DOMMatrix} transform */
  const isBottomXAxisPoint = (canvas, plot, x, y, transform) => {
    const canvasRect = canvas.getBoundingClientRect();
    const plotRect = plot.getBoundingClientRect();
    if (
      !canvasRect.width ||
      !canvasRect.height ||
      !plotRect.width ||
      !plotRect.height
    )
      return false;
    const backingX = transform.a * x + transform.c * y + transform.e;
    const backingY = transform.b * x + transform.d * y + transform.f;
    const pointX =
      canvasRect.left + (backingX * canvasRect.width) / canvas.width;
    const pointY =
      canvasRect.top + (backingY * canvasRect.height) / canvas.height;
    const axes = [...plot.querySelectorAll(".u-axis")].map((axis) =>
      axis.getBoundingClientRect(),
    );
    const xAxis = axes
      .filter(
        (rect) =>
          rect.width >= plotRect.width * 0.5 &&
          rect.top >= plotRect.top + plotRect.height * 0.5,
      )
      .sort((left, right) => right.top - left.top)[0];
    if (
      !xAxis ||
      pointX < xAxis.left ||
      pointX > xAxis.right ||
      pointY < xAxis.top ||
      pointY > xAxis.bottom
    ) {
      return false;
    }
    return !axes.some(
      (rect) =>
        rect.height >= plotRect.height * 0.5 &&
        rect.width < plotRect.width * 0.5 &&
        pointX >= rect.left &&
        pointX <= rect.right &&
        pointY >= rect.top &&
        pointY <= rect.bottom,
    );
  };

  /** @type {(this: any, ...args: any[]) => any} */
  const wrappedFillText = function (...args) {
    const canvas = this.canvas;
    const target = chartForCanvas(canvas);
    if (target) {
      const cycle = cycles.get(canvas) || { labels: [], revision: 0 };
      if (
        isBottomXAxisPoint(
          canvas,
          target.plot,
          Number(args[1]),
          Number(args[2]),
          this.getTransform(),
        )
      ) {
        cycle.labels.push(String(args[0]));
      }
      cycle.revision += 1;
      cycles.set(canvas, cycle);
      const revision = cycle.revision;
      schedule(() => {
        if (cycles.get(canvas) === cycle && cycle.revision === revision) {
          completed.set(canvas, [...cycle.labels]);
        }
      });
    }
    return Reflect.apply(originalFillText, this, args);
  };

  /** @type {(this: any, ...args: any[]) => any} */
  const wrappedClearRect = function (...args) {
    const canvas = this.canvas;
    if (chartForCanvas(canvas)) {
      const previous = cycles.get(canvas);
      cycles.set(canvas, {
        labels: [],
        revision: (previous?.revision || 0) + 1,
      });
      completed.delete(canvas);
    }
    return Reflect.apply(originalClearRect, this, args);
  };
  prototype.fillText = wrappedFillText;
  prototype.clearRect = wrappedClearRect;

  const observer = {
    /** @param {string} chartId */
    completedLabels(chartId) {
      if (!chartIds.includes(chartId)) return undefined;
      const chart = root.querySelector(`#${chartId}`);
      if (!chart) return undefined;
      const canvases = [...chart.querySelectorAll(".uplot canvas")];
      if (!canvases.length || canvases.some((canvas) => !completed.has(canvas)))
        return undefined;
      return canvases.flatMap((canvas) => completed.get(canvas) || []);
    },
    /** @param {string} [chartId] */
    reset(chartId) {
      const ids = chartId ? [chartId] : chartIds;
      for (const id of ids) {
        const chart = root.querySelector(`#${id}`);
        for (const canvas of chart?.querySelectorAll(".uplot canvas") || []) {
          cycles.delete(canvas);
          completed.delete(canvas);
        }
      }
      if (!chartId) {
        if (prototype.fillText === wrappedFillText)
          prototype.fillText = originalFillText;
        if (prototype.clearRect === wrappedClearRect)
          prototype.clearRect = originalClearRect;
      }
    },
  };
  if (view) view.__e2eCanvasAxisObserver = observer;
  return observer;
}

// The browser bootstrap name is an identity alias, not a second implementation.
export const installCanvasAxisObserverInPage = installCanvasAxisObserver;
