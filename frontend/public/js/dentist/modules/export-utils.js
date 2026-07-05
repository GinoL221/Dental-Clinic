// Utilidades de exportación de dentistas (CSV/JSON) y descarga de archivos.
// Extraído de DentistController para separar la lógica de construcción de
// contenido y descarga de la orquestación del controlador (SRP).

// Construir contenido CSV a partir de la lista de dentistas
/**
 * @param {{id: any, registrationNumber?: any, firstName?: any, lastName?: any, specialties?: {name: any}[]}[]} dentists
 * @returns {string}
 */
export function buildDentistsCSV(dentists) {
  const headers = ["ID", "Matrícula", "Nombre", "Apellido", "Especialidad"];
  return [
    headers.join(","),
    ...dentists.map((dentist) =>
      [
        dentist.id,
        dentist.registrationNumber || "",
        `"${dentist.firstName}"`,
        `"${dentist.lastName}"`,
        `"${(dentist.specialties || []).map((s) => s.name).join("; ")}"`
      ].join(",")
    ),
  ].join("\n");
}

// Construir contenido JSON a partir de la lista de dentistas
/**
 * @param {any[]} dentists
 * @returns {string}
 */
export function buildDentistsJSON(dentists) {
  return JSON.stringify(dentists, null, 2);
}

// Descargar contenido como archivo en el navegador
/**
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 * @returns {void}
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
