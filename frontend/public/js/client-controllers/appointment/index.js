export { default as AppointmentController } from "./appointment-controller.js";

// También hacer disponible globalmente para compatibilidad
if (typeof window !== "undefined") {
  window.AppointmentController = window.appointmentController;
}
