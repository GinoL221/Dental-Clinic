import { describe, it, expect, afterEach } from "vitest";
import { load } from "./+page.server.js";
import { createMockEvent } from "../test/mockFactory.js";

describe("Landing Page Server Loader", () => {
  const originalDemoEnabled = process.env.APP_DEMO_ENABLED;

  afterEach(() => {
    if (originalDemoEnabled === undefined) {
      delete process.env.APP_DEMO_ENABLED;
    } else {
      process.env.APP_DEMO_ENABLED = originalDemoEnabled;
    }
  });

  it("defaults demoMode to false when APP_DEMO_ENABLED is unset or false", () => {
    delete process.env.APP_DEMO_ENABLED;
    expect(load(createMockEvent())).toEqual({ demoMode: false });

    process.env.APP_DEMO_ENABLED = "false";
    expect(load(createMockEvent())).toEqual({ demoMode: false });

    process.env.APP_DEMO_ENABLED = "TRUE";
    expect(load(createMockEvent())).toEqual({ demoMode: false });
  });

  it("enables demoMode only when APP_DEMO_ENABLED is strictly 'true'", () => {
    process.env.APP_DEMO_ENABLED = "true";
    expect(load(createMockEvent())).toEqual({ demoMode: true });
  });
});
