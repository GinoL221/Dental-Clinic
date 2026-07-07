<script>
  /** @type {import('./$types').ActionData} */
  export var form;
</script>

<svelte:head>
  <title>Agregar Paciente | Dental Clinic</title>
</svelte:head>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Agregar Paciente</h2>
          <p class="auth-subtitle">Registra un nuevo paciente en la clínica</p>
        </div>

        {#if form && form.error}
          <div class="alert alert-danger mb-3">{form.error}</div>
        {/if}

        <form method="POST" class="auth-form">
          <div class="mb-3">
            <label for="cardIdentity" class="form-label">DNI</label>
            <input
              type="text"
              class="form-control auth-input"
              id="cardIdentity"
              name="cardIdentity"
              placeholder="Ingrese el DNI"
              value={form && form.oldData ? form.oldData.cardIdentity : ''}
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
                value={form && form.oldData ? form.oldData.firstName : ''}
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
                value={form && form.oldData ? form.oldData.lastName : ''}
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
              value={form && form.oldData ? form.oldData.email : ''}
              required
            />
          </div>

          <div class="mb-3">
            <h6>Dirección:</h6>

            <div class="row">
              <div class="col-md-8 mb-2">
                <label for="street" class="form-label">Calle:</label>
                <input
                  type="text"
                  class="form-control auth-input"
                  id="street"
                  name="street"
                  placeholder="Nombre de la calle"
                  value={form && form.oldData ? form.oldData.street : ''}
                />
              </div>
              <div class="col-md-4 mb-2">
                <label for="number" class="form-label">Número:</label>
                <input
                  type="text"
                  class="form-control auth-input"
                  id="number"
                  name="number"
                  placeholder="Nº"
                  value={form && form.oldData ? form.oldData.number : ''}
                />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-2">
                <label for="location" class="form-label">Localidad:</label>
                <input
                  type="text"
                  class="form-control auth-input"
                  id="location"
                  name="location"
                  placeholder="Ciudad/Localidad"
                  value={form && form.oldData ? form.oldData.location : ''}
                />
              </div>
              <div class="col-md-6 mb-2">
                <label for="province" class="form-label">Provincia:</label>
                <input
                  type="text"
                  class="form-control auth-input"
                  id="province"
                  name="province"
                  placeholder="Provincia"
                  value={form && form.oldData ? form.oldData.province : ''}
                />
              </div>
            </div>
          </div>

          <button type="submit" class="btn auth-btn-primary w-100 mb-3">
            Guardar Paciente
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
