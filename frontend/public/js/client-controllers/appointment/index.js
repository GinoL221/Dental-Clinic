// Re-exportar el controlador principal
export { default as AppointmentController } from "./appointment-controller.js";

// También hacer disponible globalmente para compatibilidad
if (typeof window !== "undefined") {
  // Ya se inicializa automáticamente en appointment-controller.js
  window.AppointmentController = window.appointmentController;
}
