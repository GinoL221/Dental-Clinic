package com.dh.dentalClinicMVC.configuration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * Fails startup with a clear, actionable message when {@code app.jwt.secret} (backed by the {@code
 * JWT_SECRET} env var in dev/prod) is missing, instead of the buried "Could not resolve
 * placeholder" stack trace Spring throws by default when {@code JwtService}'s {@code @Value} field
 * is first resolved.
 */
public class JwtSecretEnvironmentPostProcessor implements EnvironmentPostProcessor {

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    String secret;
    try {
      secret = environment.getProperty("app.jwt.secret");
    } catch (IllegalArgumentException unresolvedPlaceholder) {
      secret = null;
    }

    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException(
          "JWT_SECRET no está configurado. Definí la variable de entorno JWT_SECRET "
              + "(ver backend/.env.example) antes de levantar la app en cualquier perfil.");
    }
  }
}
