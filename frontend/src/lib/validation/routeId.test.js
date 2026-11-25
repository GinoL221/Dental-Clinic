import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseNumericId } from "./routeId.js";
import { actions as appointmentsActions } from "../../routes/appointments/+page.server.js";
import { load as editAppointmentLoad } from "../../routes/appointments/edit/[id]/+page.server.js";
import { actions as dentistEditActions } from "../../routes/dentists/edit/[id]/+page.server.js";
import * as api from "../api.js";
import { createMockEvent } from "../../test/mockFactory.js";

vi.mock("../api.js", () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe("BFF route/form numeric ID validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("parseNumericId accepts positive safe integers and rejects traversal or non-digits", () => {
    expect(parseNumericId("42")).toBe("42");
    expect(parseNumericId(" 7 ")).toBe("7");
    expect(parseNumericId(12)).toBe("12");
    expect(parseNumericId("0")).toBeNull();
    expect(parseNumericId("-1")).toBeNull();
    expect(parseNumericId("1.5")).toBeNull();
    expect(parseNumericId("../patients/1")).toBeNull();
    expect(parseNumericId("1?foo=bar")).toBeNull();
    expect(parseNumericId("")).toBeNull();
    expect(parseNumericId(null)).toBeNull();
  });

  it("rejects traversal/non-numeric ID in appointments delete action without calling apiFetch", async () => {
    const formData = new URLSearchParams();
    formData.append("id", "../patients/1");

    const event = createMockEvent({
      request: { formData: vi.fn().mockResolvedValue(formData) },
      locals: { user: { id: 1, role: "ADMIN" }, authToken: "tok" },
    });

    const result = await appointmentsActions.delete(event);
    expect(result).toMatchObject({ success: false });
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  it("rejects non-numeric params.id in appointment edit load with 400 without calling apiFetch", async () => {
    const event = createMockEvent({
      params: { id: "../patients/1" },
      locals: { user: { id: 1, role: "ADMIN" }, authToken: "tok" },
    });

    await expect(editAppointmentLoad(event)).rejects.toMatchObject({
      status: 400,
    });
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  it("rejects non-numeric specialtyId in dentist assignSpecialty without calling apiFetch", async () => {
    const formData = new URLSearchParams();
    formData.append("specialtyId", "1/../../patients/2");

    const event = createMockEvent({
      params: { id: "5" },
      request: { formData: vi.fn().mockResolvedValue(formData) },
      locals: { user: { id: 1, role: "ADMIN" }, authToken: "tok" },
    });

    const result = await dentistEditActions.assignSpecialty(event);
    expect(result).toHaveProperty("specialtyError");
    expect(api.apiFetch).not.toHaveBeenCalled();
  });
});
