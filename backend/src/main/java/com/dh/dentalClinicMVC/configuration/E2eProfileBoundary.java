package com.dh.dentalClinicMVC.configuration;

import java.time.DayOfWeek;
import java.time.LocalDate;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Profiles;

public class E2eProfileBoundary implements EnvironmentPostProcessor {

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    validate(environment);
  }

  void validate(ConfigurableEnvironment environment) {
    if (!environment.acceptsProfiles(Profiles.of("e2e"))) {
      return;
    }

    String url = environment.getProperty("spring.datasource.url", "");
    if (!url.startsWith("jdbc:h2:")) {
      throw new IllegalStateException(
          "The e2e profile requires an H2 datasource; refusing to start with an unsafe database configuration.");
    }
  }

  static LocalDate nextUtcWeekday(LocalDate date) {
    LocalDate result = date.plusDays(1);
    while (result.getDayOfWeek() == DayOfWeek.SATURDAY
        || result.getDayOfWeek() == DayOfWeek.SUNDAY) {
      result = result.plusDays(1);
    }
    return result;
  }
}
