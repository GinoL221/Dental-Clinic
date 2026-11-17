package com.dh.dentalClinicMVC.configuration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Carga datos demo al iniciar la aplicación si la base está vacía. Solo activo con el perfil "dev"
 * y nunca si "prod" está activo. Idempotente: no inserta si ya existe el usuario admin.
 */
@Component
@Profile("dev & !prod")
public class DataInitializer implements ApplicationRunner {

  private final DemoSeedService demoSeedService;

  public DataInitializer(DemoSeedService demoSeedService) {
    this.demoSeedService = demoSeedService;
  }

  @Override
  public void run(ApplicationArguments args) {
    demoSeedService.seedIfEmpty();
  }
}
