/**
 * Status transition map for appointment statuses.
 *
 * EXACT mirror of the backend's authoritative rules in
 * `AppointmentStatus.canTransitionTo`
 * (backend/src/main/java/com/dh/dentalClinicMVC/entity/AppointmentStatus.java:9-19):
 *
 *   this == target            -> true  (no-op transition allowed, lines 10-12)
 *   SCHEDULED   -> any status (line 14)
 *   IN_PROGRESS -> COMPLETED | CANCELLED (line 15)
 *   COMPLETED   -> nothing (line 16, terminal)
 *   CANCELLED   -> nothing (line 17, terminal)
 *
 * The backend service enforces this on every change
 * (backend/src/main/java/com/dh/dentalClinicMVC/service/impl/
 * AppointmentServiceImpl.java:190-191, InvalidStatusTransitionException),
 * so the UI must offer only these options (design.md §6.3).
 *
 * `VALID_TRANSITIONS` lists only *other* reachable statuses (the no-op is
 * expressed by `canTransition`, not by a self-entry); terminal states have
 * empty lists, meaning "no selector" in the UI.
 *
 * @type {Record<string, string[]>}
 */
const VALID_TRANSITIONS = {
  SCHEDULED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Returns the statuses an appointment with the given status may transition
 * to (excluding the no-op self-transition). Terminal and unknown statuses
 * return an empty array — the UI must not render a status selector.
 *
 * @param {string | undefined} status
 * @returns {string[]}
 */
export function validTransitions(status) {
  const targets = (status && VALID_TRANSITIONS[status]) || [];
  return [...targets];
}

/**
 * Mirrors the backend's `canTransitionTo` exactly, including the no-op rule
 * (`this == target` → true, AppointmentStatus.java:10-12).
 *
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (from === to) {
    return true;
  }
  return Boolean(from && to && VALID_TRANSITIONS[from]?.includes(to));
}
