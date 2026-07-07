<script>
  /** @type {import('./$types').PageData} */
  export var data;
  /** @type {import('./$types').ActionData} */
  export var form;

  $: patient = (form && form.oldData) || data.patient;
</script>

<svelte:head>
  <title>Editar Paciente | Dental Clinic</title>
</svelte:head>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Editar Paciente</h2>
          <p class="auth-subtitle">Modifica los datos del paciente</p>
        </div>

        {#if form && form.error}
          <div class="alert alert-danger mb-3">{form.error}</div>
        {/if}

        <form method="POST" class="auth-form">
          <div class="mb-3">
            <label for="cardIdentity" class="form-label">DNI</label>
            <input
              type="number"
              class="form-control auth-input"
              id="cardIdentity"
              name="cardIdentity"
              placeholder="Ingrese el DNI"
              value={patient.cardIdentity || ''}
              required
            />
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="firstName" class="form-label">Nombre</label>
              <input
                type="text"
                class="form-control auth-input"
                id="firstName"
                name="firstName"
                placeholder="Ingrese el nombre"
                value={patient.firstName || ''}
                required
              />
            </div>
            <div class="col-md-6 mb-3">
              <label for="lastName" class="form-label">Apellido</label>
              <input
                type="text"
                class="form-control auth-input"
                id="lastName"
                name="lastName"
                placeholder="Ingrese el apellido"
                value={patient.lastName || ''}
                required
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="form-control auth-input"
              id="email"
              name="email"
              placeholder="Ingrese el email"
              value={patient.email || ''}
              required
            />
          </div>

          <div class="mb-3">
            <label for="admissionDate" class="form-label">Fecha de Admisión</label>
            <input
              type="date"
              class="form-control auth-input"
              id="admissionDate"
              name="admissionDate"
              value={patient.admissionDate || ''}
              required
            />
          </div>

          <div class="form-group mb-3">
            <h6>Dirección:</h6>

            <div class="row">
              <div class="col-md-8 mb-2">
                <label for="street_edit" class="form-label">Calle:</label>
                <input
                  type="text"
                  class="form-control"
                  id="street_edit"
                  name="street"
                  placeholder="Nombre de la calle"
                  value={(patient.address && patient.address.street) || ''}
                />
              </div>
              <div class="col-md-4 mb-2">
                <label for="number_edit" class="form-label">Número:</label>
                <input
                  type="number"
                  class="form-control"
                  id="number_edit"
                  name="number"
                  placeholder="Nº"
                  value={(patient.address && patient.address.number) || ''}
                />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-2">
                <label for="location_edit" class="form-label">Localidad:</label>
                <input
                  type="text"
                  class="form-control"
                  id="location_edit"
                  name="location"
                  placeholder="Ciudad/Localidad"
                  value={(patient.address && patient.address.location) || ''}
                />
              </div>
              <div class="col-md-6 mb-2">
                <label for="province_edit" class="form-label">Provincia:</label>
                <input
                  type="text"
                  class="form-control"
                  id="province_edit"
                  name="province"
                  placeholder="Provincia"
                  value={(patient.address && patient.address.province) || ''}
                />
              </div>
            </div>
          </div>

          <button type="submit" class="btn auth-btn-primary w-100 mb-3">
            Actualizar Paciente
          </button>

          <div class="auth-footer">
            <p>
              <a href="/patients" class="auth-link">← Volver a la lista de pacientes</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</main>
