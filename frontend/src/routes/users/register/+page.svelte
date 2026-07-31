<script>
  import { enhance } from '$app/forms';
  import { tick } from 'svelte';
  import { validateRegisterField, validateRegisterForm } from '$lib/validation/registerForm.js';

  export let form;

  const FIELD_ORDER = [
    'firstName',
    'lastName',
    'email',
    'cardIdentity',
    'street',
    'number',
    'location',
    'province',
    'password',
    'confirmPassword',
  ];

  let showPassword = false;
  /** @type {HTMLElement | null} */
  let errorBannerEl = null;

  /** @type {import('$lib/validation/registerForm.js').RegisterValues} */
  let values = {
    firstName: String(form?.oldData?.firstName || ''),
    lastName: String(form?.oldData?.lastName || ''),
    email: String(form?.oldData?.email || ''),
    cardIdentity: String(form?.oldData?.cardIdentity || ''),
    street: String(form?.oldData?.street || ''),
    number: String(form?.oldData?.number || ''),
    location: String(form?.oldData?.location || ''),
    province: String(form?.oldData?.province || ''),
    password: '',
    confirmPassword: '',
  };

  /** @type {Record<string, string>} */
  let fieldErrors = {};
  /** @type {Record<string, boolean>} */
  let touched = {};

  function togglePassword() {
    showPassword = !showPassword;
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  function validateAndTrack(name, value) {
    const error = validateRegisterField(name, value, values);
    fieldErrors = { ...fieldErrors, [name]: error };
    if (error) {
      touched = { ...touched, [name]: true };
    }
  }

  /** @param {string} name */
  function handleBlur(name) {
    validateAndTrack(name, values[name]);
  }

  /** @param {string} name */
  function handleInput(name) {
    if (touched[name]) {
      validateAndTrack(name, values[name]);
    }
  }

  /** @param {Record<string, string>} errors */
  function focusFirstInvalidField(errors) {
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      /** @type {HTMLElement | null} */
      const el = document.getElementById(firstInvalid);
      el?.focus();
    }
  }

  function focusErrorBanner() {
    errorBannerEl?.focus();
  }

  /** @param {{ update: () => Promise<void> }} result */
  async function handleSubmitResult({ update }) {
    await update();
    await tick();
    focusErrorBanner();
  }

  /** @param {{ cancel: () => void }} args */
  function handleSubmit({ cancel }) {
    const errors = validateRegisterForm(values);
    fieldErrors = errors;

    if (Object.keys(errors).length > 0) {
      for (const name of Object.keys(errors)) {
        touched = { ...touched, [name]: true };
      }
      cancel();
      tick().then(() => focusFirstInvalidField(errors));
      return;
    }

    return handleSubmitResult;
  }
</script>

<svelte:head>
  <title>Registro de Paciente | Clínica Odontológica</title>
  <link rel="stylesheet" href="/css/views/auth.css" />
</svelte:head>

<main class="main-content auth-page">
  <div class="auth-container">
    <div class="auth-card auth-card--wide">
      <div class="auth-header">
        <h2 class="auth-title">
          <i class="bi bi-person-plus-fill me-2"></i>Registro de Paciente
        </h2>
        <p class="auth-subtitle">Crea tu cuenta para solicitar citas en nuestra clínica</p>
      </div>

      <form
        id="registerForm"
        class="auth-form register-form"
        method="POST"
        use:enhance={handleSubmit}
      >
        <input type="hidden" id="role" name="role" value="PATIENT" />

        {#if form?.errors?.general?.msg}
          <div
            class="alert alert-danger mb-3"
            role="alert"
            tabindex="-1"
            bind:this={errorBannerEl}
          >
            <i class="bi bi-exclamation-triangle me-2"></i>
            {form.errors.general.msg}
          </div>
        {/if}

        <!-- Datos Personales -->
        <div class="section-header mb-3">
          <h5 class="text-secondary border-bottom pb-2">
            <i class="bi bi-person me-2"></i>Datos Personales
          </h5>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label for="firstName" class="form-label">
              <i class="bi bi-person me-1"></i>Nombre
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.firstName}
              id="firstName"
              name="firstName"
              placeholder="Ingresa tu nombre"
              bind:value={values.firstName}
              on:blur={() => handleBlur('firstName')}
              on:input={() => handleInput('firstName')}
              aria-invalid={fieldErrors.firstName ? 'true' : 'false'}
              aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
              required
              minlength="2"
            />
            {#if fieldErrors.firstName}
              <p id="firstName-error" class="field-error">{fieldErrors.firstName}</p>
            {/if}
          </div>
          <div class="col-md-6">
            <label for="lastName" class="form-label">
              <i class="bi bi-person me-1"></i>Apellido
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.lastName}
              id="lastName"
              name="lastName"
              placeholder="Ingresa tu apellido"
              bind:value={values.lastName}
              on:blur={() => handleBlur('lastName')}
              on:input={() => handleInput('lastName')}
              aria-invalid={fieldErrors.lastName ? 'true' : 'false'}
              aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
              required
              minlength="2"
            />
            {#if fieldErrors.lastName}
              <p id="lastName-error" class="field-error">{fieldErrors.lastName}</p>
            {/if}
          </div>
        </div>

        <!-- Correo & DNI -->
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="email" class="form-label">
              <i class="bi bi-envelope me-1"></i>Correo electrónico
            </label>
            <input
              type="email"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.email}
              id="email"
              name="email"
              placeholder="ejemplo@correo.com"
              bind:value={values.email}
              on:blur={() => handleBlur('email')}
              on:input={() => handleInput('email')}
              aria-invalid={fieldErrors.email ? 'true' : 'false'}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              required
            />
            {#if fieldErrors.email}
              <p id="email-error" class="field-error">{fieldErrors.email}</p>
            {/if}
          </div>
          <div class="col-md-6">
            <label for="cardIdentity" class="form-label">
              <i class="bi bi-card-text me-1"></i>DNI
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.cardIdentity}
              id="cardIdentity"
              name="cardIdentity"
              placeholder="12345678"
              bind:value={values.cardIdentity}
              on:blur={() => handleBlur('cardIdentity')}
              on:input={() => handleInput('cardIdentity')}
              aria-invalid={fieldErrors.cardIdentity ? 'true' : 'false'}
              aria-describedby={fieldErrors.cardIdentity ? 'cardIdentity-error' : undefined}
              required
            />
            {#if fieldErrors.cardIdentity}
              <p id="cardIdentity-error" class="field-error">{fieldErrors.cardIdentity}</p>
            {/if}
          </div>
        </div>

        <!-- Dirección -->
        <div class="section-header mb-3">
          <h5 class="text-secondary border-bottom pb-2">
            <i class="bi bi-geo-alt me-2"></i>Dirección
          </h5>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label for="street" class="form-label">
              <i class="bi bi-road me-1"></i>Calle
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.street}
              id="street"
              name="street"
              placeholder="Av. Principal"
              bind:value={values.street}
              on:blur={() => handleBlur('street')}
              on:input={() => handleInput('street')}
              aria-invalid={fieldErrors.street ? 'true' : 'false'}
              aria-describedby={fieldErrors.street ? 'street-error' : undefined}
              required
            />
            {#if fieldErrors.street}
              <p id="street-error" class="field-error">{fieldErrors.street}</p>
            {/if}
          </div>
          <div class="col-md-6">
            <label for="number" class="form-label">
              <i class="bi bi-hash me-1"></i>Número
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.number}
              id="number"
              name="number"
              placeholder="123"
              pattern="[0-9A-Za-z\-\s]*"
              maxlength="10"
              title="Ingrese solo números, letras, guiones y espacios (ej: 123, 123-A, 123 B)"
              bind:value={values.number}
              on:blur={() => handleBlur('number')}
              on:input={() => handleInput('number')}
              aria-invalid={fieldErrors.number ? 'true' : 'false'}
              aria-describedby={fieldErrors.number ? 'number-error' : undefined}
              required
            />
            {#if fieldErrors.number}
              <p id="number-error" class="field-error">{fieldErrors.number}</p>
            {/if}
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label for="location" class="form-label">
              <i class="bi bi-building me-1"></i>Localidad
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.location}
              id="location"
              name="location"
              placeholder="Ciudad"
              bind:value={values.location}
              on:blur={() => handleBlur('location')}
              on:input={() => handleInput('location')}
              aria-invalid={fieldErrors.location ? 'true' : 'false'}
              aria-describedby={fieldErrors.location ? 'location-error' : undefined}
              required
            />
            {#if fieldErrors.location}
              <p id="location-error" class="field-error">{fieldErrors.location}</p>
            {/if}
          </div>
          <div class="col-md-6">
            <label for="province" class="form-label">
              <i class="bi bi-map me-1"></i>Provincia
            </label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.province}
              id="province"
              name="province"
              placeholder="Provincia"
              bind:value={values.province}
              on:blur={() => handleBlur('province')}
              on:input={() => handleInput('province')}
              aria-invalid={fieldErrors.province ? 'true' : 'false'}
              aria-describedby={fieldErrors.province ? 'province-error' : undefined}
              required
            />
            {#if fieldErrors.province}
              <p id="province-error" class="field-error">{fieldErrors.province}</p>
            {/if}
          </div>
        </div>

        <!-- Seguridad -->
        <div class="section-header mb-3">
          <h5 class="text-secondary border-bottom pb-2">
            <i class="bi bi-shield-lock me-2"></i>Seguridad
          </h5>
        </div>

        <div class="row mb-4">
          <div class="col-md-6">
            <label for="password" class="form-label">
              <i class="bi bi-lock me-1"></i>Contraseña
            </label>
            <div class="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                class="form-control auth-input password-input"
                class:is-invalid={fieldErrors.password}
                id="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={values.password}
                on:blur={() => handleBlur('password')}
                on:input={(event) => {
                  values.password = /** @type {HTMLInputElement} */ (event.target).value;
                  handleInput('password');
                }}
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                required
                minlength="6"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="btn-eye-toggle"
                on:click={togglePassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
              </button>
            </div>
            {#if fieldErrors.password}
              <p id="password-error" class="field-error">{fieldErrors.password}</p>
            {/if}
          </div>
          <div class="col-md-6">
            <label for="confirmPassword" class="form-label">
              <i class="bi bi-lock-fill me-1"></i>Confirmar Contraseña
            </label>
            <input
              type="password"
              class="form-control auth-input"
              class:is-invalid={fieldErrors.confirmPassword}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Repite tu contraseña"
              bind:value={values.confirmPassword}
              on:blur={() => handleBlur('confirmPassword')}
              on:input={() => handleInput('confirmPassword')}
              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              required
              autocomplete="new-password"
            />
            {#if fieldErrors.confirmPassword}
              <p id="confirmPassword-error" class="field-error">{fieldErrors.confirmPassword}</p>
            {/if}
          </div>
        </div>

        <button type="submit" class="btn auth-btn-primary w-100 mb-3">
          <i class="bi bi-person-check me-2"></i>Crear cuenta de paciente
        </button>

        <div class="auth-footer">
          <p>¿Ya tienes una cuenta?
            <a href="/login" class="auth-link">Inicia sesión aquí</a>
          </p>
          <div class="privacy-notice">
            <i class="bi bi-shield-check"></i>
            <small>Tus datos están protegidos y solo serán utilizados para brindarte atención médica</small>
          </div>
        </div>
      </form>
    </div>
  </div>
</main>
