package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Set;
import org.junit.jupiter.api.Test;

class E2eSeedPropertiesTest {

  @Test
  void missingCredentialsAreNamedWithoutExposingValues() {
    String secret = "super-secret-value";
    E2eSeedProperties properties = new E2eSeedProperties(null, secret, null, "admin-password");

    assertEquals(Set.of("E2E_ADMIN_EMAIL", "E2E_NON_ADMIN_EMAIL"), properties.missingNames());
    assertFalse(properties.validationMessage().contains(secret));
  }
}
