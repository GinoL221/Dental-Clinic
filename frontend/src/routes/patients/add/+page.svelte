<script>
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').ActionData} */
  export let form;

  $: fieldErrors = form?.fieldErrors;
</script>

<svelte:head>
  <title>Agregar Paciente | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Paciente"
  subtitle="Registrá un nuevo paciente en la clínica"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/patients"
  backLabel="Volver a la lista de pacientes"
>
  <form method="POST" class="auth-form">
    <div class="mb-3">
      <label for="cardIdentity" class="form-label">DNI</label>
      <input
        type="text"
        class="form-control auth-input"
        id="cardIdentity"
        name="cardIdentity"
        placeholder="Ingresá el DNI"
        value={form && form.oldData ? form.oldData.cardIdentity : ""}
        aria-invalid={fieldErrorFor(fieldErrors, "cardIdentity")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "cardIdentity")
          ? "cardIdentity-error"
          : undefined}
        required
      />
      {#if fieldErrorFor(fieldErrors, "cardIdentity")}
        <p id="cardIdentity-error" class="field-error">
          {fieldErrorFor(fieldErrors, "cardIdentity")}
        </p>
      {/if}
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label for="firstName" class="form-label">Nombre</label>
        <input
          type="text"
          class="form-control auth-input"
          id="firstName"
          name="firstName"
          placeholder="Ingresá el nombre"
          value={form && form.oldData ? form.oldData.firstName : ""}
          aria-invalid={fieldErrorFor(fieldErrors, "firstName")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "firstName")
            ? "firstName-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "firstName")}
          <p id="firstName-error" class="field-error">
            {fieldErrorFor(fieldErrors, "firstName")}
          </p>
        {/if}
      </div>
      <div class="col-md-6 mb-3">
        <label for="lastName" class="form-label">Apellido</label>
        <input
          type="text"
          class="form-control auth-input"
          id="lastName"
          name="lastName"
          placeholder="Ingresá el apellido"
          value={form && form.oldData ? form.oldData.lastName : ""}
          aria-invalid={fieldErrorFor(fieldErrors, "lastName")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "lastName")
            ? "lastName-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "lastName")}
          <p id="lastName-error" class="field-error">
            {fieldErrorFor(fieldErrors, "lastName")}
          </p>
        {/if}
      </div>
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input
        type="email"
        class="form-control auth-input"
        id="email"
        name="email"
        placeholder="Ingresá el email"
        value={form && form.oldData ? form.oldData.email : ""}
        aria-invalid={fieldErrorFor(fieldErrors, "email") ? "true" : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "email")
          ? "email-error"
          : undefined}
        required
      />
      {#if fieldErrorFor(fieldErrors, "email")}
        <p id="email-error" class="field-error">
          {fieldErrorFor(fieldErrors, "email")}
        </p>
      {/if}
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
            value={form && form.oldData ? form.oldData.street : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "address.street")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "address.street")
              ? "street-error"
              : undefined}
          />
          {#if fieldErrorFor(fieldErrors, "address.street")}
            <p id="street-error" class="field-error">
              {fieldErrorFor(fieldErrors, "address.street")}
            </p>
          {/if}
        </div>
        <div class="col-md-4 mb-2">
          <label for="number" class="form-label">Número:</label>
          <input
            type="text"
            class="form-control auth-input"
            id="number"
            name="number"
            placeholder="Nº"
            value={form && form.oldData ? form.oldData.number : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "address.number")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "address.number")
              ? "number-error"
              : undefined}
          />
          {#if fieldErrorFor(fieldErrors, "address.number")}
            <p id="number-error" class="field-error">
              {fieldErrorFor(fieldErrors, "address.number")}
            </p>
          {/if}
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
            value={form && form.oldData ? form.oldData.location : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "address.location")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "address.location")
              ? "location-error"
              : undefined}
          />
          {#if fieldErrorFor(fieldErrors, "address.location")}
            <p id="location-error" class="field-error">
              {fieldErrorFor(fieldErrors, "address.location")}
            </p>
          {/if}
        </div>
        <div class="col-md-6 mb-2">
          <label for="province" class="form-label">Provincia:</label>
          <input
            type="text"
            class="form-control auth-input"
            id="province"
            name="province"
            placeholder="Provincia"
            value={form && form.oldData ? form.oldData.province : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "address.province")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "address.province")
              ? "province-error"
              : undefined}
          />
          {#if fieldErrorFor(fieldErrors, "address.province")}
            <p id="province-error" class="field-error">
              {fieldErrorFor(fieldErrors, "address.province")}
            </p>
          {/if}
        </div>
      </div>
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
        aria-invalid={fieldErrorFor(fieldErrors, "password")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "password")
          ? "password-error"
          : "password-help"}
      />
      {#if fieldErrorFor(fieldErrors, "password")}
        <p id="password-error" class="field-error">
          {fieldErrorFor(fieldErrors, "password")}
        </p>
      {/if}
      <div id="password-help" class="form-text text-muted">
        Si se deja en blanco, el sistema genera una clave temporal aleatoria que
        el paciente deberá cambiar al ingresar.
      </div>
    </div>

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Guardar Paciente
    </button>
  </form>
</FormCard>
