package com.dh.dentalClinicMVC.configuration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Opt-in demo dataset initializer for public portfolio deployments ({@code prod} profile with
 * {@code app.demo.enabled=true}). Absent unless explicitly enabled.
 */
@Component
@Profile("prod & !e2e")
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
public class DemoModeInitializer implements ApplicationRunner {

  private final DemoSeedService demoSeedService;

  public DemoModeInitializer(DemoSeedService demoSeedService) {
    this.demoSeedService = demoSeedService;
  }

  @Override
  public void run(ApplicationArguments args) {
    demoSeedService.seedIfEmpty();
  }
}
