import { describe, it, expect, vi, afterEach } from "vitest";
import { getBffAuthHeaders } from "./bffHeaders.js";

describe("getBffAuthHeaders", () => {
  const originalSecret = process.env.BFF_SHARED_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.BFF_SHARED_SECRET;
    } else {
      process.env.BFF_SHARED_SECRET = originalSecret;
    }
  });

  it("omits BFF headers when BFF_SHARED_SECRET is unset or blank", () => {
    delete process.env.BFF_SHARED_SECRET;
    expect(getBffAuthHeaders(() => "203.0.113.1")).toEqual({
      "Content-Type": "application/json",
    });

    process.env.BFF_SHARED_SECRET = "   ";
    expect(getBffAuthHeaders(() => "203.0.113.1")).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("includes trimmed X-Client-IP and X-BFF-Auth when secret is configured", () => {
    process.env.BFF_SHARED_SECRET = " shared-secret-123 ";
    expect(getBffAuthHeaders(() => " 203.0.113.9 ")).toEqual({
      "Content-Type": "application/json",
      "X-Client-IP": "203.0.113.9",
      "X-BFF-Auth": "shared-secret-123",
    });
  });

  it("falls back safely when getClientAddress throws or returns blank", () => {
    process.env.BFF_SHARED_SECRET = "shared-secret-123";
    const failing = vi.fn(() => {
      throw new Error("no socket");
    });
    expect(getBffAuthHeaders(failing)).toEqual({
      "Content-Type": "application/json",
    });
    expect(getBffAuthHeaders(() => "   ")).toEqual({
      "Content-Type": "application/json",
    });
  });
});
