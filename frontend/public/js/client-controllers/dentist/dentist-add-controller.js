document.addEventListener("DOMContentLoaded", function () {
  function showMessage(message, type) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    responseDiv.style.display = "block";

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      responseDiv.style.display = "none";
    }, 5000);
  }

  // Manejar el formulario de agregar dentista
  const addForm = document.getElementById("add_new_dentist");
  if (addForm) {
    addForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const dentistData = {
        registrationNumber: document
          .getElementById("registrationNumber")
          .value.trim(),
        name: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
      };

      console.log("Sending new dentist data:", dentistData);

      // Validaciones básicas
      if (!dentistData.name || dentistData.name.length < 2) {
        showMessage("El nombre debe tener al menos 2 caracteres", "danger");
        return;
      }

      if (!dentistData.lastName || dentistData.lastName.length < 2) {
        showMessage("El apellido debe tener al menos 2 caracteres", "danger");
        return;
      }

      if (
        !dentistData.registrationNumber ||
        dentistData.registrationNumber.length < 3
      ) {
        showMessage("La matrícula debe tener al menos 3 caracteres", "danger");
        return;
      }

      // Mostrar un indicador de carga
      const submitButton = document.getElementById("btn-add-new-dentist");
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

      try {
        // Verificar si DentistAPI está disponible
        if (typeof DentistAPI === "undefined") {
          throw new Error(
            "API de dentistas no disponible. Asegúrate de incluir el script dentist-api.js"
          );
        }

        const dentist = await DentistAPI.create(dentistData);

        // Manejar respuesta exitosa
        const name = dentist.name || dentist.firstName || "Dentista";
        const lastName = dentist.lastName || dentist.surname || "";
        showMessage(
          `Dentista ${name} ${lastName} agregado exitosamente`,
          "success"
        );

        // Limpiar el formulario
        addForm.reset();

        // Redirigir a la lista después de 2 segundos
        setTimeout(() => {
          window.location.href = "/dentists";
        }, 2000);
      } catch (error) {
        console.error("Error al agregar dentista:", error);
        showMessage(`Error al agregar el dentista: ${error.message}`, "danger");
      } finally {
        // Restaurar el botón
        submitButton.disabled = false;
        submitButton.innerHTML = "Guardar Odontólogo";
      }
    });
  }
});
