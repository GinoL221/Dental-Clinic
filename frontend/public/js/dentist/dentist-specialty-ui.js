/**
 * dentist-specialty-ui.js
 * Manages specialty assignment/removal in the dentist edit view.
 * One responsibility: specialty section of the dentist edit page.
 */
import DentistAPI from "../api/dentist-api.js";
import SpecialtyAPI from "../api/specialty-api.js";

let currentDentistId = null;
let eventsAttached = false;

async function init() {
  currentDentistId = window.dentistId || getDentistIdFromUrl();
  if (!currentDentistId) return;

  await renderSpecialtySection();
}

function getDentistIdFromUrl() {
  const parts = window.location.pathname.split("/");
  const editIdx = parts.indexOf("edit");
  return editIdx !== -1 && parts[editIdx + 1] ? parts[editIdx + 1] : null;
}

async function renderSpecialtySection() {
  const container = document.getElementById("specialty-section");
  if (!container) return;

  try {
    const [dentist, allSpecialties] = await Promise.all([
      DentistAPI.getById(currentDentistId),
      SpecialtyAPI.getAll(),
    ]);

    const assigned = (dentist && dentist.specialties) ? dentist.specialties : [];
    const assignedIds = new Set(assigned.map((s) => String(s.id)));

    const available = (allSpecialties || []).filter((s) => !assignedIds.has(String(s.id)));

    container.innerHTML = buildSectionHTML(assigned, available);
    if (!eventsAttached) {
      attachEvents(container);
      eventsAttached = true;
    }
  } catch (err) {
    container.innerHTML = `<p class="text-danger small">No se pudieron cargar las especialidades.</p>`;
  }
}

function buildSectionHTML(assigned, available) {
  const tags = assigned.length
    ? assigned
        .map(
          (s) =>
            `<span class="badge bg-primary me-1 mb-1 d-inline-flex align-items-center gap-1" style="font-size:0.85rem">
              ${escapeHtml(s.name)}
              <button type="button" class="btn-close btn-close-white btn-sm specialty-remove-btn"
                data-specialty-id="${s.id}" aria-label="Eliminar ${escapeHtml(s.name)}"
                style="font-size:0.65rem"></button>
            </span>`
        )
        .join("")
    : `<span class="text-muted small">Sin especialidades asignadas</span>`;

  const options = available.length
    ? available.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")
    : `<option value="" disabled>No hay especialidades disponibles</option>`;

  return `
    <hr class="my-4">
    <h5 class="mb-2">Especialidades</h5>

    <div class="mb-3" id="assigned-tags">
      <label class="form-label fw-semibold">Asignadas</label>
      <div class="d-flex flex-wrap gap-1" id="specialty-tags">${tags}</div>
    </div>

    <div class="mb-3" id="assign-new-specialty">
      <label for="specialty-select" class="form-label fw-semibold">Agregar especialidad</label>
      <div class="input-group">
        <select class="form-select" id="specialty-select">
          <option value="">-- Seleccionar --</option>
          ${options}
        </select>
        <button type="button" class="btn btn-outline-primary" id="specialty-assign-btn">Asignar</button>
      </div>
    </div>

    <div id="specialty-feedback" class="mt-1"></div>
  `;
}

function attachEvents(container) {
  // Remove specialty — delegated, works after every rerender
  container.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".specialty-remove-btn");
    if (removeBtn) {
      const specialtyId = removeBtn.dataset.specialtyId;
      removeBtn.disabled = true;
      try {
        await DentistAPI.removeSpecialty(currentDentistId, specialtyId);
        showFeedback("Especialidad eliminada", "success");
        await renderSpecialtySection();
      } catch (err) {
        showFeedback(err.message || "Error al eliminar especialidad", "danger");
        removeBtn.disabled = false;
      }
      return;
    }

    // Assign specialty — delegated
    const assignBtn = e.target.closest("#specialty-assign-btn");
    if (assignBtn) {
      const select = container.querySelector("#specialty-select");
      const specialtyId = select && select.value;
      if (!specialtyId) {
        showFeedback("Selecciona una especialidad", "warning");
        return;
      }
      assignBtn.disabled = true;
      try {
        await DentistAPI.assignSpecialty(currentDentistId, specialtyId);
        showFeedback("Especialidad asignada", "success");
        await renderSpecialtySection();
      } catch (err) {
        showFeedback(err.message || "Error al asignar especialidad", "danger");
        assignBtn.disabled = false;
      }
    }
  });
}

function showFeedback(message, type = "info") {
  const el = document.getElementById("specialty-feedback");
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type} py-1 px-2 small">${escapeHtml(message)}</div>`;
  setTimeout(() => {
    const alert = el.querySelector(".alert");
    if (alert) alert.remove();
  }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", init);
