<script>
  import { enhance } from '$app/forms';

  export let form;

  let showPassword = false;

  function togglePassword() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Registro de Paciente | Clínica Odontológica</title>
  <link rel="stylesheet" href="/css/views/auth.css" />
</svelte:head>

<main class="main-content auth-page">
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">
          <i class="bi bi-person-plus-fill me-2"></i>Registro de Paciente
        </h2>
        <p class="auth-subtitle">Crea tu cuenta para solicitar citas en nuestra clínica</p>
      </div>

      <form id="registerForm" class="auth-form" method="POST" use:enhance>
        <input type="hidden" id="role" name="role" value="PATIENT" />

        {#if form?.errors?.general?.msg}
          <div class="alert alert-danger mb-3">
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
              id="firstName"
              name="firstName"
              placeholder="Ingresa tu nombre"
              value={form?.oldData?.firstName || ''}
              required
              minlength="2"
            />
          </div>
          <div class="col-md-6">
            <label for="lastName" class="form-label">
              <i class="bi bi-person me-1"></i>Apellido
            </label>
            <input
              type="text"
              class="form-control auth-input"
              id="lastName"
              name="lastName"
              placeholder="Ingresa tu apellido"
              value={form?.oldData?.lastName || ''}
              required
              minlength="2"
            />
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
              id="email"
              name="email"
              placeholder="ejemplo@correo.com"
              value={form?.oldData?.email || ''}
              required
            />
          </div>
          <div class="col-md-6">
            <label for="cardIdentity" class="form-label">
              <i class="bi bi-card-text me-1"></i>DNI
            </label>
            <input
              type="text"
              class="form-control auth-input"
              id="cardIdentity"
              name="cardIdentity"
              placeholder="12345678"
              value={form?.oldData?.cardIdentity || ''}
              required
            />
          </div>
        </div>

        <!-- Dirección -->
        <div class="section-header mb-3">
          <h5 class="text-secondary border-bottom pb-2">
            <i class="bi bi-geo-alt me-2"></i>Dirección
          </h5>
        </div>

        <div class="mb-3">
          <label for="street" class="form-label">
            <i class="bi bi-road me-1"></i>Calle
          </label>
          <input
            type="text"
            class="form-control auth-input"
            id="street"
            name="street"
            placeholder="Av. Principal"
            value={form?.oldData?.street || ''}
            required
          />
        </div>

        <div class="row mb-3">
          <div class="col-md-3">
            <label for="number" class="form-label">
              <i class="bi bi-hash me-1"></i>Número
            </label>
            <input
              type="text"
              class="form-control auth-input"
              id="number"
              name="number"
              placeholder="123"
              pattern="[0-9A-Za-z\-\s]*"
              maxlength="10"
              title="Ingrese solo números, letras, guiones y espacios (ej: 123, 123-A, 123 B)"
              value={form?.oldData?.number || ''}
              required
            />
          </div>
          <div class="col-md-9">
            <label for="location" class="form-label">
              <i class="bi bi-building me-1"></i>Localidad
            </label>
            <input
              type="text"
              class="form-control auth-input"
              id="location"
              name="location"
              placeholder="Ciudad"
              value={form?.oldData?.location || ''}
              required
            />
          </div>
        </div>

        <div class="mb-3">
          <label for="province" class="form-label">
            <i class="bi bi-map me-1"></i>Provincia
          </label>
          <input
            type="text"
            class="form-control auth-input"
            id="province"
            name="province"
            placeholder="Provincia"
            value={form?.oldData?.province || ''}
            required
          />
        </div>

        <!-- Seguridad -->
        <div class="section-header mb-3">
          <h5 class="text-secondary border-bottom pb-2">
            <i class="bi bi-shield-lock me-2"></i>Seguridad
          </h5>
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">
            <i class="bi bi-lock me-1"></i>Contraseña
          </label>
          <div class="position-relative">
            <input
              type={showPassword ? 'text' : 'password'}
              class="form-control password-input"
              id="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              required
              minlength="6"
              autocomplete="new-password"
              style="padding-right: 45px;"
            />
            <button type="button" class="btn-eye-toggle" on:click={togglePassword} style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6c757d;">
              <i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label for="confirmPassword" class="form-label">
            <i class="bi bi-lock-fill me-1"></i>Confirmar Contraseña
          </label>
          <input
            type="password"
            class="form-control auth-input"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Repite tu contraseña"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn auth-btn-primary w-100 mb-3">
          <i class="bi bi-person-check me-2"></i>Crear cuenta de paciente
        </button>

        <div class="auth-footer">
          <p>¿Ya tienes una cuenta?
            <a href="/login" class="auth-link">Inicia sesión aquí</a>
          </p>
          <div class="alert alert-info d-flex align-items-center mt-3" role="alert">
            <i class="bi bi-shield-check me-2"></i>
            <small>Tus datos están protegidos y solo serán utilizados para brindarte atención médica</small>
          </div>
        </div>
      </form>
    </div>
  </div>
</main>
