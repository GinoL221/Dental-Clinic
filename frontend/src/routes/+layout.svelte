<script>
  export let data;
  $: user = data?.user;
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/base/normalize.css" />
  <link rel="stylesheet" href="/css/base/tokens.css" />
  <link rel="stylesheet" href="/css/base/typography.css" />
  <link rel="stylesheet" href="/css/base/layout.css" />
  <link rel="stylesheet" href="/css/components/buttons.css" />
  <link rel="stylesheet" href="/css/components/cards.css" />
  <link rel="stylesheet" href="/css/components/forms.css" />
  <link rel="stylesheet" href="/css/components/alerts.css" />
  <link rel="stylesheet" href="/css/components/tables.css" />
  <link rel="stylesheet" href="/css/layout/header.css" />
  <link rel="stylesheet" href="/css/layout/footer.css" />
  <link rel="stylesheet" href="/css/utilities/animations.css" />
  <link rel="stylesheet" href="/css/utilities/responsive.css" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</svelte:head>

<nav class="navbar navbar-expand-lg bg-body-tertiary sticky-top shadow-sm">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">
      <img
        src="/assets/Logo.webp"
        alt="Dental Clinic"
        height="40"
        class="d-inline-block align-text-top"
        loading="lazy"
      />
    </a>
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarSupportedContent"
      aria-controls="navbarSupportedContent"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      {#if user && user.email}
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          {#if user.role === 'ADMIN'}
            <li class="nav-item">
              <a class="nav-link" href="/dashboard">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
              </a>
            </li>
          {/if}

          <li class="nav-item dropdown">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Gestión Pacientes
            </a>
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="/patients">Listar pacientes</a>
              </li>
              {#if user.role === 'ADMIN'}
                <li>
                  <a class="dropdown-item" href="/patients/add">Agregar pacientes</a>
                </li>
              {:else}
                <li>
                  <a class="dropdown-item" href="#pacientes">Nuestros pacientes</a>
                </li>
              {/if}
            </ul>
          </li>

          <li class="nav-item dropdown">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Gestión Odontólogos
            </a>
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="/dentists">Listar odontólogos</a>
              </li>
              {#if user.role === 'ADMIN'}
                <li>
                  <a class="dropdown-item" href="/dentists/add">Agregar odontólogo</a>
                </li>
              {:else}
                <li>
                  <a class="dropdown-item" href="#odontologos">Nuestros Odontologos</a>
                </li>
              {/if}
            </ul>
          </li>

          <li class="nav-item dropdown">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Gestión Citas
            </a>
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="/appointments">Listar citas</a>
              </li>
              <li>
                <a class="dropdown-item" href="/appointments/add">Programar cita</a>
              </li>
            </ul>
          </li>
        </ul>
        <ul class="navbar-nav ms-auto">
          <li class="nav-item dropdown user-dropdown">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-2"></i>
              Bienvenido/a, {user.firstName}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <h6 class="dropdown-header">{user.email}</h6>
              </li>
              <li>
                <span class="dropdown-item-text small text-muted">
                  {#if user.role === 'ADMIN'}
                    Administrador
                  {:else if user.role === 'DENTIST'}
                    Dentista
                  {:else if user.role === 'PATIENT'}
                    Paciente
                  {:else}
                    {user.role}
                  {/if}
                </span>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <form action="/users/logout" method="POST" class="d-inline">
                  <button type="submit" class="dropdown-item">
                    <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
                  </button>
                </form>
              </li>
            </ul>
          </li>
        </ul>
      {:else}
        <ul class="navbar-nav ms-auto">
          <li class="nav-item d-flex">
            <a href="/login" class="btn btn-outline-primary me-2">Ingresar</a>
            <a href="/users/register" class="btn btn-primary">Registrarse</a>
          </li>
        </ul>
      {/if}
    </div>
  </div>
</nav>

<main class="flex-shrink-0">
  <slot />
</main>

<footer class="mt-auto">
  <div class="container py-0 px-3">
    <div class="d-flex justify-content-between align-items-center flex-wrap">
      <div class="footer-logo">
        <img src="/assets/Logotipo.webp" alt="Clínica Odontológica" height="100" class="footer-logo-img" loading="lazy">
      </div>
      <div class="footer-text text-end">
        <span>&copy; {new Date().getFullYear()} Clínica Odontológica. Todos los derechos reservados.</span>
      </div>
    </div>
  </div>
</footer>
