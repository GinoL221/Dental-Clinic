export {};

declare global {
  class uPlot {
    constructor(opts: any, data: any[], target: HTMLElement);
    destroy(): void;
    setData(data: any[]): void;
    setScale(scale: string, limits: any): void;
    setSize(size: { width: number; height: number }): void;
    static paths: {
      spline: () => any;
      [key: string]: any;
    };
  }

  interface Window {
    // Set by static/js/lib/uPlot.min.js, loaded on demand by src/lib/charts/dashboardCharts.js
    uPlot?: typeof uPlot;
    // Installed only in Playwright pages by tests/fullstack/fixtures/canvas-axis-observer.js;
    // page objects wait for it before dereferencing.
    __e2eCanvasAxisObserver: {
      completedLabels(chartId: string): string[] | undefined;
      reset(chartId?: string): void;
    };
  }
}
