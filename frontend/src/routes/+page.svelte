<svelte:head>
  <title>Dental Clinic - Gino Lencina</title>
  <link rel="stylesheet" href="/css/views/landing.css" />
</svelte:head>

<main class="main-content landing-page">
  <!-- Hero Section -->
  <section class="landing-hero">
    <div class="container">
      <div class="row align-items-center min-vh-100">
        <div class="col-lg-8 mx-auto text-center">
          <!-- Portfolio Badge -->
          <div class="hero-badge">
            <i class="bi bi-code-slash"></i>
            Dental Clinic - Gino Lencina
          </div>

          <!-- Hero Title -->
          <h1 class="hero-title">
            <img src="/assets/Isotipo.webp" alt="Dental Clinic" class="hero-logo" /> Dental Clinic
          </h1>

          <!-- Hero Subtitle -->
          <p class="hero-subtitle">
            Sistema completo de gestión para clínicas dentales
          </p>

          <!-- Hero Description -->
          <p class="hero-description">
            Aplicación web profesional con autenticación JWT, dashboard interactivo y gestión completa de citas, pacientes y dentistas. Desarrollada con tecnologías modernas y mejores prácticas de desarrollo.
          </p>

          <!-- Hero Buttons -->
          <div class="hero-buttons">
            <a href="/login" class="btn auth-btn-primary">
              <i class="bi bi-box-arrow-in-right me-1"></i>
              Iniciar Sesión
            </a>
            <a href="/users/register" class="btn auth-btn-secondary">
              <i class="bi bi-person-plus me-1"></i>
              Registrarse
            </a>
          </div>
        </div>
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
      </div>

      <div class="row">
        <div class="col-lg-3 col-md-6 mb-4">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-calendar-check"></i>
            </div>
            <h3 class="feature-title">Gestión de Citas</h3>
            <p class="feature-description">
              Sistema completo de programación y seguimiento de citas con estados dinámicos y notificaciones.
            </p>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-person-badge"></i>
            </div>
            <h3 class="feature-title">Registro de Dentistas</h3>
            <p class="feature-description">
              Gestión profesional de dentistas con especialidades, horarios y asignación automática de citas.
            </p>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-people"></i>
            </div>
            <h3 class="feature-title">Gestión de Pacientes</h3>
            <p class="feature-description">
              Base de datos completa de pacientes con historiales médicos y información de contacto.
            </p>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
            <h3 class="feature-title">Dashboard Interactivo</h3>
            <p class="feature-description">
              Análisis en tiempo real con gráficos, métricas y filtros avanzados para mejor toma de decisiones.
            </p>
          </div>
        </div>
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
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" alt="Spring Boot" />
          </div>
          <div class="tech-name">Spring Boot</div>
          <div class="tech-category">Backend Framework</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="MySQL" />
          </div>
          <div class="tech-name">MySQL</div>
          <div class="tech-category">Base de Datos</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <svg viewBox="0 0 256 257" width="256" height="257" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
              <path fill="#FFF" d="M147.386 69.071 147.129 0h-38.515l.257 69.071 19.257 26.448zM108.871 187.442v69.328h38.515v-69.328l-19.258-26.447z" />
              <path fill="#00F2E6" d="m147.386 187.442 40.57 55.976 31.069-22.596-40.57-55.975-31.069-10.015zM108.871 69.071 68.044 13.095 36.975 35.691l40.57 55.976 31.326 10.014z" />
              <path fill="#00B9F1" d="M77.545 91.667 11.811 70.355 0 106.816l65.733 21.569 31.069-10.271zM159.198 138.399l19.257 26.448 65.734 21.311L256 149.697l-65.733-21.312z" />
              <path fill="#D63AFF" d="M190.267 128.385 256 106.816l-11.811-36.461-65.734 21.312-19.257 26.447zM65.733 128.385 0 149.697l11.811 36.461 65.734-21.311 19.257-26.448z" />
              <path fill="#FB015B" d="m77.545 164.847-40.57 55.975 31.069 22.596 40.827-55.976v-32.61zM178.455 91.667l40.57-55.976-31.069-22.596-40.57 55.976v32.61z" />
            </svg>
          </div>
          <div class="tech-name">JWT</div>
          <div class="tech-category">Autenticación</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" alt="Bootstrap" />
          </div>
          <div class="tech-name">Bootstrap 5</div>
          <div class="tech-category">Frontend Framework</div>
        </div>

        <div class="tech-item">
          <div class="tech-icon">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg" alt="SvelteKit" style="max-height: 100%; max-width: 100%;" />
          </div>
          <div class="tech-name">SvelteKit</div>
          <div class="tech-category">Framework</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Demo Credentials Section -->
  <section class="demo-credentials" style="padding: 4rem 0; background: rgba(74, 144, 226, 0.1);">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto text-center">
          <h3 style="color: var(--color-primario); margin-bottom: 2rem;">
            🚀 Credenciales Demo
          </h3>
          <div class="row">
            <div class="col-md-4">
              <div class="demo-card" style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h4 style="color: var(--color-primario); font-size: 1.2rem;">🧑‍💻 Usuario Admin</h4>
                <p class="mb-1"><strong>Email:</strong> admin@dentalclinic.com</p>
                <p class="mb-2"><strong>Password:</strong> Admin123!</p>
                <small class="text-muted">Acceso completo al sistema</small>
              </div>
            </div>
            <div class="col-md-4">
              <div class="demo-card" style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h4 style="color: var(--color-primario); font-size: 1.2rem;">🦷 Usuario Dentista</h4>
                <p class="mb-1"><strong>Email:</strong> dentista@dentalclinic.com</p>
                <p class="mb-2"><strong>Password:</strong> Dentista123!</p>
                <small class="text-muted">Gestión de citas y pacientes</small>
              </div>
            </div>
            <div class="col-md-4">
              <div class="demo-card" style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h4 style="color: var(--color-primario); font-size: 1.2rem;">😁 Usuario Paciente</h4>
                <p class="mb-1"><strong>Email:</strong> paciente@email.com</p>
                <p class="mb-2"><strong>Password:</strong> Pacientet123!</p>
                <small class="text-muted">Creación de citas</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="landing-cta">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto text-center">
          <h2 class="cta-title">¿Listo para explorar el proyecto?</h2>
          <p class="cta-subtitle">
            Descubre todas las funcionalidades y tecnologías implementadas en este proyecto de portfolio
          </p>

          <div class="cta-buttons">
            <a href="/dashboard" class="btn btn-cta-primary">
              <i class="bi bi-rocket-takeoff me-1"></i>
              Demo Rápido
            </a>
            <a href="/login" class="btn btn-cta-secondary">
              <i class="bi bi-box-arrow-in-right me-1"></i>
              Iniciar Sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<!-- Portfolio Badge flotante -->
<a href="https://github.com/GinoL221/Dental-Clinic" class="portfolio-badge" target="_blank" rel="noopener noreferrer">
  <i class="bi bi-github"></i>
  Ver en GitHub
</a>
