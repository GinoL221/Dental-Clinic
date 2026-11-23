<svelte:head>
  <title>Dental Clinic - Gino Lencina</title>
</svelte:head>

<div class="landing-page">
  <!-- Hero Section -->
  <section class="landing-hero">
    <div class="container">
      <div class="hero-split-grid">
        <div class="hero-content">
          <div class="hero-brand-row">
            <img src="/assets/Isotipo.webp" alt="" class="hero-logo" />
            <span class="hero-badge">
              <i class="bi bi-code-slash" aria-hidden="true"></i>
              Dental Clinic — Gino Lencina
            </span>
          </div>

          <h1 class="hero-title">Gestión clínica de turnos sin colisiones</h1>

          <p class="hero-subtitle">
            Pacientes, odontólogos y agenda bajo control de acceso por rol
          </p>

          <p class="hero-description">
            Aplicación web profesional con autenticación JWT, dashboard
            interactivo y gestión completa de turnos, pacientes y odontólogos.
            Desarrollada con tecnologías modernas y mejores prácticas de
            desarrollo.
          </p>

          <div class="hero-buttons">
            <a href="/login" class="btn auth-btn-primary">
              <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
              Iniciar Sesión
            </a>
            <a href="/users/register" class="btn auth-btn-secondary">
              <i class="bi bi-person-plus" aria-hidden="true"></i>
              Registrarse
            </a>
          </div>
        </div>

        <aside
          class="access-panel demo-credentials-card"
          aria-label="Credenciales de acceso demo"
        >
          <h2 class="access-panel-title">Acceso rápido por rol (Demo)</h2>
          <p class="panel-lead">
            Credenciales reales de prueba para explorar cada perfil en el
            sistema.
          </p>

          <ul class="role-list">
            <li class="role-row">
              <div class="role-info">
                <span class="role-chip role-chip-admin">ADMIN</span>
                <div class="role-title">Administrador</div>
                <div class="role-scope">Acceso completo al sistema</div>
              </div>
              <div class="role-creds">
                <div>admin@dentalclinic.com</div>
                <div>admin123</div>
              </div>
            </li>

            <li class="role-row">
              <div class="role-info">
                <span class="role-chip role-chip-dentist">DENTIST</span>
                <div class="role-title">Dra. María González</div>
                <div class="role-scope">Agenda y turnos</div>
              </div>
              <div class="role-creds">
                <div>maria.gonzalez@dentalclinic.com</div>
                <div>maria123</div>
              </div>
            </li>

            <li class="role-row">
              <div class="role-info">
                <span class="role-chip role-chip-patient">PATIENT</span>
                <div class="role-title">Juan Pérez</div>
                <div class="role-scope">Consulta y reserva de turnos</div>
              </div>
              <div class="role-creds">
                <div>juan.perez@email.com</div>
                <div>juan123</div>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="landing-features">
    <div class="container">
      <div class="features-header">
        <h2 class="features-title">Características Principales</h2>
        <p class="features-subtitle">
          Funcionalidades completas para la gestión moderna de clínicas dentales
        </p>
        <div class="section-rule" aria-hidden="true"></div>
      </div>

      <div class="features-grid">
        <article class="feature-card">
          <div class="feature-icon" aria-hidden="true">
            <i class="bi bi-calendar-check"></i>
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Agenda de Turnos</h3>
            <p class="feature-description">
              Máquina de estados con transiciones validadas y restricción única
              en la base de datos que impide turnos duplicados para el mismo
              odontólogo.
            </p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-icon" aria-hidden="true">
            <i class="bi bi-person-badge"></i>
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Registro de Odontólogos</h3>
            <p class="feature-description">
              Gestión de odontólogos con permisos por rol y guardas anti-IDOR:
              cada usuario accede solo a sus propios datos.
            </p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-icon" aria-hidden="true">
            <i class="bi bi-people"></i>
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Gestión de Pacientes</h3>
            <p class="feature-description">
              Alta, edición y listado de pacientes con control de acceso por rol
              y esquema versionado con migraciones Flyway.
            </p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-icon" aria-hidden="true">
            <i class="bi bi-graph-up-arrow"></i>
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Dashboard Interactivo</h3>
            <p class="feature-description">
              Métricas, gráficos y filtros combinables sobre un snapshot
              consultado por request: siempre datos reales, nunca promesas de
              tiempo real.
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Tech Stack Section -->
  <section class="landing-tech">
    <div class="container">
      <div class="tech-header">
        <h2 class="tech-title">Tecnologías Utilizadas</h2>
        <p class="features-subtitle">
          Stack tecnológico moderno con las mejores prácticas de desarrollo
        </p>
      </div>

      <div class="tech-grid">
        <div class="tech-item">
          <div class="tech-icon">
            <img
              src="/assets/tech/spring-original.svg"
              alt="Spring Boot"
              width="48"
              height="48"
            />
          </div>
          <div class="tech-name">Spring Boot</div>
          <div class="tech-category">Backend Framework</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img
              src="/assets/tech/mysql-original.svg"
              alt="MySQL"
              width="48"
              height="48"
            />
          </div>
          <div class="tech-name">MySQL</div>
          <div class="tech-category">Base de Datos</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon tech-icon-dark">
            <svg
              viewBox="0 0 256 257"
              width="256"
              height="257"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid"
              aria-hidden="true"
            >
              <path
                fill="#FFF"
                d="M147.386 69.071 147.129 0h-38.515l.257 69.071 19.257 26.448zM108.871 187.442v69.328h38.515v-69.328l-19.258-26.447z"
              />
              <path
                fill="#00F2E6"
                d="m147.386 187.442 40.57 55.976 31.069-22.596-40.57-55.975-31.069-10.015zM108.871 69.071 68.044 13.095 36.975 35.691l40.57 55.976 31.326 10.014z"
              />
              <path
                fill="#00B9F1"
                d="M77.545 91.667 11.811 70.355 0 106.816l65.733 21.569 31.069-10.271zM159.198 138.399l19.257 26.448 65.734 21.311L256 149.697l-65.733-21.312z"
              />
              <path
                fill="#D63AFF"
                d="M190.267 128.385 256 106.816l-11.811-36.461-65.734 21.312-19.257 26.447zM65.733 128.385 0 149.697l11.811 36.461 65.734-21.311 19.257-26.448z"
              />
              <path
                fill="#FB015B"
                d="m77.545 164.847-40.57 55.975 31.069 22.596 40.827-55.976v-32.61zM178.455 91.667l40.57-55.976-31.069-22.596-40.57 55.976v32.61z"
              />
            </svg>
          </div>
          <div class="tech-name">JWT</div>
          <div class="tech-category">Autenticación</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img
              src="/assets/tech/bootstrap-original.svg"
              alt="Bootstrap"
              width="48"
              height="48"
            />
          </div>
          <div class="tech-name">Bootstrap 5</div>
          <div class="tech-category">Frontend Framework</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img
              src="/assets/tech/svelte-original.svg"
              alt="SvelteKit"
              width="48"
              height="48"
            />
          </div>
          <div class="tech-name">SvelteKit</div>
          <div class="tech-category">Framework</div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="landing-cta">
    <div class="container">
      <div class="cta-inner">
        <div class="cta-copy">
          <h2 class="cta-title">¿Listo para explorar el proyecto?</h2>
          <p class="cta-subtitle">
            Descubrí todas las funcionalidades y tecnologías implementadas en
            este proyecto de portfolio
          </p>
        </div>

        <div class="cta-buttons">
          <a
            href="/login"
            class="btn btn-cta-primary"
            aria-label="Ir a la página de inicio de sesión con credenciales demo"
          >
            <i class="bi bi-rocket-takeoff" aria-hidden="true"></i>
            Demo Rápido
          </a>
          <a
            href="https://github.com/GinoL221/Dental-Clinic"
            class="btn btn-cta-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="bi bi-github" aria-hidden="true"></i>
            Ver en GitHub
          </a>
        </div>
      </div>
    </div>
  </section>
</div>
