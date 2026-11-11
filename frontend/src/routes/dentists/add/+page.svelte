<script>
  import FormCard from "$lib/components/FormCard.svelte";

  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Agregar Odontólogo | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Odontólogo"
  subtitle="Registra un nuevo profesional en la clínica"
  error={form?.error}
  backHref="/dentists"
  backLabel="Volver a la lista de odontólogos"
>
  <form method="POST" class="auth-form">
    <div class="mb-3">
      <label for="registrationNumber" class="form-label">Matrícula</label>
      <input
        type="text"
        class="form-control auth-input"
        id="registrationNumber"
        name="registrationNumber"
        placeholder="Ingrese la matrícula"
        value={form && form.oldData ? form.oldData.registrationNumber : ""}
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
          value={form && form.oldData ? form.oldData.firstName : ""}
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
          value={form && form.oldData ? form.oldData.lastName : ""}
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
        value={form && form.oldData ? form.oldData.email : ""}
        required
      />
    </div>

    <div class="mb-3">
      <label for="password" class="form-label">Contraseña (opcional)</label>
      <input
        type="password"
        class="form-control auth-input"
        id="password"
        name="password"
        placeholder="Dejar en blanco para generar clave temporal segura"
        autocomplete="new-password"
      />
      <div class="form-text text-muted">
        Si se deja en blanco, el sistema genera una clave temporal aleatoria que
        el profesional deberá cambiar al ingresar.
      </div>
    </div>

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Guardar Odontólogo
    </button>
  </form>
</FormCard>
