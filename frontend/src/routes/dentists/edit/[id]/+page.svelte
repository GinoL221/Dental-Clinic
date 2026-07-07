<script>
  /** @type {import('./$types').PageData} */
  export var data;
  /** @type {import('./$types').ActionData} */
  export var form;

  $: dentist = (form && form.oldData) || data.dentist;
</script>

<svelte:head>
  <title>Editar Odontólogo | Dental Clinic</title>
</svelte:head>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Editar Odontólogo</h2>
          <p class="auth-subtitle">Modifica los datos del odontólogo</p>
        </div>

        {#if form && form.error}
          <div class="alert alert-danger mb-3">{form.error}</div>
        {/if}

        <form method="POST" class="auth-form">
          <div class="mb-3">
            <label for="registrationNumber" class="form-label">Matrícula</label>
            <input
              type="text"
              class="form-control auth-input"
              id="registrationNumber"
              name="registrationNumber"
              placeholder="Ingrese la matrícula"
              value={dentist.registrationNumber || ''}
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
                value={dentist.firstName || ''}
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
                value={dentist.lastName || ''}
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
              placeholder="ejemplo@email.com"
              value={dentist.email || ''}
              required
            />
          </div>

          <button type="submit" class="btn auth-btn-primary w-100 mb-3">
            Actualizar Odontólogo
          </button>

          <div class="auth-footer">
            <p>
              <a href="/dentists" class="auth-link">← Volver a la lista de odontólogos</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</main>
