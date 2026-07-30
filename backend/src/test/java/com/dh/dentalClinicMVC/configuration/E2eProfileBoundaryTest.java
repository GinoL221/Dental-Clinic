package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class E2eProfileBoundaryTest {

  @Test
  void e2eRejectsNonH2DatasourceWithoutLoggingItsValue() {
    String unsafeUrl = "jdbc:mysql://prod.example/dental";
    MockEnvironment environment =
        new MockEnvironment()
            .withProperty("spring.profiles.active", "e2e")
            .withProperty("spring.datasource.url", unsafeUrl);

    IllegalStateException error =
        assertThrows(
            IllegalStateException.class, () -> new E2eProfileBoundary().validate(environment));

    org.junit.jupiter.api.Assertions.assertFalse(error.getMessage().contains(unsafeUrl));
  }

  @Test
  void e2eAcceptsH2AndOtherProfilesRemainUntouched() {
    MockEnvironment h2 =
        new MockEnvironment()
            .withProperty("spring.profiles.active", "e2e")
            .withProperty("spring.datasource.url", "jdbc:h2:mem:e2e");
    MockEnvironment dev =
        new MockEnvironment()
            .withProperty("spring.profiles.active", "dev")
            .withProperty("spring.datasource.url", "jdbc:mysql://dev.example/dental");

    assertDoesNotThrow(() -> new E2eProfileBoundary().validate(h2));
    assertDoesNotThrow(() -> new E2eProfileBoundary().validate(dev));
    assertEquals(
        LocalDate.of(2026, 8, 3), E2eProfileBoundary.nextUtcWeekday(LocalDate.of(2026, 8, 1)));
    assertEquals(
        LocalDate.of(2026, 8, 5), E2eProfileBoundary.nextUtcWeekday(LocalDate.of(2026, 8, 4)));
  }
}
