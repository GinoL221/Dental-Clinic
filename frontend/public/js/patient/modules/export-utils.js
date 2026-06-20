// Utilidades de exportación de pacientes (CSV/JSON) y descarga de archivos.
// Extraído de PatientController para separar la lógica de construcción de
// contenido y descarga de la orquestación del controlador (SRP).

// Construir contenido CSV a partir de la lista de pacientes
export function buildPatientsCSV(patients) {
  const headers = ["ID", "DNI", "Nombre", "Apellido", "Email"];
  return [
    headers.join(","),
    ...patients.map((patient) =>
      [
        patient.id,
        patient.cardIdentity || "",
        `"${patient.firstName}"`,
        `"${patient.lastName}"`,
        `"${patient.email}"`,
      ].join(",")
    ),
  ].join("\n");
}

// Construir contenido JSON a partir de la lista de pacientes
export function buildPatientsJSON(patients) {
  return JSON.stringify(patients, null, 2);
}

// Descargar contenido como archivo en el navegador
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
