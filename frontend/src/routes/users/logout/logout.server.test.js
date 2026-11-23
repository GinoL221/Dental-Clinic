import { describe, it, expect, vi } from "vitest";
import { load, actions } from "./+page.server.js";
import { createMockEvent } from "../../../test/mockFactory.js";

describe("Logout Route Server Load & Action", () => {
  it("load() deletes auth cookies and redirects 303 to /", () => {
    const cookies = { delete: vi.fn() };
    const event = createMockEvent({ cookies });

    let thrown;
    try {
      load(event);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toMatchObject({ status: 303, location: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("authToken", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userRole", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userEmail", { path: "/" });
  });

  it("actions.default deletes auth cookies and redirects 303 to /", async () => {
    const cookies = { delete: vi.fn() };
    const event = createMockEvent({ cookies });

    await expect(actions.default(event)).rejects.toMatchObject({
      status: 303,
      location: "/",
    });

    expect(cookies.delete).toHaveBeenCalledWith("authToken", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userRole", { path: "/" });
    expect(cookies.delete).toHaveBeenCalledWith("userEmail", { path: "/" });
  });
});
