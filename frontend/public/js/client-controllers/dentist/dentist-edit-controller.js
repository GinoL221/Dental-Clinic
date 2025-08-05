document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const dentistId = urlParams.get("id") || window.dentistId;

  // Función para mostrar mensajes
  function showMessage(message, type) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    responseDiv.style.display = "block";
  }

  // Cargar datos del dentista al cargar la página
  function loadDentistData() {
    if (!dentistId) {
      showMessage("ID de dentista no proporcionado", "danger");
      return;
    }

    fetch(`${window.API_BASE_URL}/dentists/${dentistId}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Dentista no encontrado");
        }
      })
      .then((dentist) => {
        console.log("Dentist data received:", dentist);
        console.log("Properties available:", Object.keys(dentist));

        document.getElementById("dentist_id").value = dentist.id;
        document.getElementById("registrationNumber").value =
          dentist.registrationNumber || dentist.matricula || "";

        // Manejo robusto de propiedades de nombre
        const firstName = dentist.firstName || dentist.name || "";
        const lastName = dentist.lastName || dentist.surname || "";

        document.getElementById("firstName").value = firstName;
        document.getElementById("lastName").value = lastName;
      })
      .catch((error) => {
        console.error("Error al cargar dentista:", error);
        showMessage("Error al cargar los datos del dentista", "danger");
      });
  }

  // Manejar el formulario de editar dentista
  const editForm = document.getElementById("edit_dentist_form");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const dentistData = {
        id: parseInt(document.getElementById("dentist_id").value),
        registrationNumber: parseInt(
          document.getElementById("registrationNumber").value
        ),
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
      };

      console.log("Sending dentist data:", dentistData);

      fetch(`${window.API_BASE_URL}/dentists`, {
        method: "PUT",
        headers: window.apiConfig.headers,
        body: JSON.stringify(dentistData),
      })
        .then((response) => response.text())
        .then((message) => {
          showMessage(message, "success");

          // Redirigir a la lista después de 2 segundos
          setTimeout(() => {
            window.location.href = "/dentists";
          }, 2000);
        })
        .catch((error) => {
          console.error("Error al actualizar dentista:", error);
          showMessage("Error al actualizar el dentista", "danger");
        });
    });
  }

  loadDentistData();
});
