import { describe, it, expect } from "vitest";
import { validTransitions, canTransition } from "./statusMachine.js";

/**
 * These tests assert an EXACT mirror of the backend transition rules in
 * AppointmentStatus.canTransitionTo
 * (backend/src/main/java/com/dh/dentalClinicMVC/entity/AppointmentStatus.java:9-19):
 *
 *   this == target            -> true (no-op allowed, lines 10-12)
 *   SCHEDULED   -> any status (line 14)
 *   IN_PROGRESS -> COMPLETED | CANCELLED (line 15)
 *   COMPLETED   -> nothing (line 16, terminal)
 *   CANCELLED   -> nothing (line 17, terminal)
 *
 * The backend is authoritative: backend/src/main/java/com/dh/dentalClinicMVC/
 * service/impl/AppointmentServiceImpl.java:190 rejects transitions with
 * InvalidStatusTransitionException when canTransitionTo returns false.
 */
describe("statusMachine (exact mirror of backend AppointmentStatus)", () => {
  describe("validTransitions", () => {
    it("SCHEDULED can reach every other status", () => {
      expect(validTransitions("SCHEDULED")).toEqual([
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ]);
    });

    it("IN_PROGRESS can only reach COMPLETED and CANCELLED", () => {
      expect(validTransitions("IN_PROGRESS")).toEqual([
        "COMPLETED",
        "CANCELLED",
      ]);
    });

    it("terminal states offer no transitions", () => {
      expect(validTransitions("COMPLETED")).toEqual([]);
      expect(validTransitions("CANCELLED")).toEqual([]);
    });

    it("unknown or missing statuses offer no transitions (defensive)", () => {
      expect(validTransitions("UNKNOWN")).toEqual([]);
      expect(validTransitions("")).toEqual([]);
      expect(validTransitions(undefined)).toEqual([]);
    });

    it("returns a fresh array so callers cannot mutate the map", () => {
      const options = validTransitions("SCHEDULED");
      options.push("COMPLETED");
      expect(validTransitions("SCHEDULED")).toEqual([
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ]);
    });
  });

  describe("canTransition", () => {
    it("allows every legal edge", () => {
      expect(canTransition("SCHEDULED", "IN_PROGRESS")).toBe(true);
      expect(canTransition("SCHEDULED", "COMPLETED")).toBe(true);
      expect(canTransition("SCHEDULED", "CANCELLED")).toBe(true);
      expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
      expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
    });

    it("rejects every illegal edge", () => {
      expect(canTransition("IN_PROGRESS", "SCHEDULED")).toBe(false);
      expect(canTransition("COMPLETED", "SCHEDULED")).toBe(false);
      expect(canTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
      expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
      expect(canTransition("CANCELLED", "SCHEDULED")).toBe(false);
      expect(canTransition("CANCELLED", "IN_PROGRESS")).toBe(false);
      expect(canTransition("CANCELLED", "COMPLETED")).toBe(false);
    });

    it("allows the backend no-op (this == target, lines 10-12)", () => {
      expect(canTransition("SCHEDULED", "SCHEDULED")).toBe(true);
      expect(canTransition("IN_PROGRESS", "IN_PROGRESS")).toBe(true);
      expect(canTransition("COMPLETED", "COMPLETED")).toBe(true);
      expect(canTransition("CANCELLED", "CANCELLED")).toBe(true);
    });

    it("rejects unknown statuses on either side", () => {
      expect(canTransition("UNKNOWN", "SCHEDULED")).toBe(false);
      expect(canTransition("SCHEDULED", "UNKNOWN")).toBe(false);
    });
  });
});
