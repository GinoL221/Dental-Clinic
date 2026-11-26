<script>
  import "bootstrap/dist/css/bootstrap.min.css";
  import "bootstrap-icons/font/bootstrap-icons.css";
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";

  let { data, children } = $props();
  const user = $derived(data?.user);
  const pathname = $derived(page.url.pathname);

  onMount(() => {
    void import("bootstrap/dist/js/bootstrap.bundle.min.js");
  });
</script>

<nav class="navbar navbar-expand-lg sticky-top">
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
        <ul class="navbar-nav mx-lg-auto mb-2 mb-lg-0">
          {#if user.role === "ADMIN"}
            <li class="nav-item">
              <a
                class="nav-link"
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
              >
                <i class="bi bi-speedometer2 me-1" aria-hidden="true"
                ></i>Dashboard
              </a>
            </li>
          {/if}

          {#if user.role !== "PATIENT"}
            <li class="nav-item dropdown">
              <button
                type="button"
                class="nav-link dropdown-toggle"
                class:is-active={pathname.startsWith("/patients")}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Gestión Pacientes
              </button>
              <ul class="dropdown-menu">
                <li>
                  <a
                    class="dropdown-item"
                    href="/patients"
                    aria-current={pathname === "/patients" ? "page" : undefined}
                    >Listar pacientes</a
                  >
                </li>
                {#if user.role === "ADMIN"}
                  <li>
                    <a
                      class="dropdown-item"
                      href="/patients/add"
                      aria-current={pathname === "/patients/add"
                        ? "page"
                        : undefined}>Agregar pacientes</a
                    >
                  </li>
                {/if}
              </ul>
            </li>
          {/if}

          <li class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              class:is-active={pathname.startsWith("/dentists")}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Gestión Odontólogos
            </button>
            <ul class="dropdown-menu">
              <li>
                <a
                  class="dropdown-item"
                  href="/dentists"
                  aria-current={pathname === "/dentists" ? "page" : undefined}
                  >Listar odontólogos</a
                >
              </li>
              {#if user.role === "ADMIN"}
                <li>
                  <a
                    class="dropdown-item"
                    href="/dentists/add"
                    aria-current={pathname === "/dentists/add"
                      ? "page"
                      : undefined}>Agregar odontólogo</a
                  >
                </li>
              {/if}
            </ul>
          </li>

          <li class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              class:is-active={pathname.startsWith("/appointments")}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Gestión Turnos
            </button>
            <ul class="dropdown-menu">
              <li>
                <a
                  class="dropdown-item"
                  href="/appointments"
                  aria-current={pathname === "/appointments"
                    ? "page"
                    : undefined}>Listar turnos</a
                >
              </li>
              <li>
                <a
                  class="dropdown-item"
                  href="/appointments/add"
                  aria-current={pathname === "/appointments/add"
                    ? "page"
                    : undefined}>Programar turno</a
                >
              </li>
            </ul>
          </li>
        </ul>
        <ul class="navbar-nav">
          <li class="nav-item dropdown user-dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle d-flex align-items-center"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-2" aria-hidden="true"></i>
              Bienvenido/a, {user.firstName}
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <span class="dropdown-header">{user.email}</span>
              </li>
              <li>
                <span class="dropdown-item-text small user-dropdown-role">
                  {#if user.role === "ADMIN"}
                    Administrador
                  {:else if user.role === "DENTIST"}
                    Odontólogo
                  {:else if user.role === "PATIENT"}
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
                    <i class="bi bi-box-arrow-right me-2" aria-hidden="true"
                    ></i>Cerrar Sesión
                  </button>
                </form>
              </li>
            </ul>
          </li>
        </ul>
      {:else}
        <ul class="navbar-nav ms-auto">
          <li class="nav-item d-flex">
            <a
              href="/login"
              class="btn btn-outline-primary me-2"
              aria-current={pathname === "/login" ? "page" : undefined}
              >Ingresar</a
            >
            <a
              href="/users/register"
              class="btn btn-primary"
              aria-current={pathname === "/users/register" ? "page" : undefined}
              >Registrarse</a
            >
          </li>
        </ul>
      {/if}
    </div>
  </div>
</nav>

<main class="flex-shrink-0">
  {@render children()}
</main>

<footer class="mt-auto">
  <div class="container py-0 px-3">
    <div class="d-flex justify-content-between align-items-center flex-wrap">
      <div class="footer-logo">
        <img
          src="/assets/Logotipo.webp"
          alt="Clínica Odontológica"
          height="100"
          class="footer-logo-img"
          loading="lazy"
        />
      </div>
      <div class="footer-text">
        <span
          >&copy; {new Date().getFullYear()} Clínica Odontológica. Todos los derechos
          reservados.</span
        >
      </div>
    </div>
  </div>
</footer>
