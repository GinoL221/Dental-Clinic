package com.dh.dentalClinicMVC.configuration;

import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "e2e")
public record E2eSeedProperties(
    String adminEmail, String adminPassword, String nonAdminEmail, String nonAdminPassword) {
  private static final String ADMIN_EMAIL = "E2E_ADMIN_EMAIL";
  private static final String ADMIN_PASSWORD = "E2E_ADMIN_PASSWORD";
  private static final String NON_ADMIN_EMAIL = "E2E_NON_ADMIN_EMAIL";
  private static final String NON_ADMIN_PASSWORD = "E2E_NON_ADMIN_PASSWORD";

  public Set<String> missingNames() {
    Set<String> missing = new LinkedHashSet<>();
    addIfBlank(missing, ADMIN_EMAIL, adminEmail);
    addIfBlank(missing, ADMIN_PASSWORD, adminPassword);
    addIfBlank(missing, NON_ADMIN_EMAIL, nonAdminEmail);
    addIfBlank(missing, NON_ADMIN_PASSWORD, nonAdminPassword);
    return Set.copyOf(missing);
  }

  public void validateRequiredCredentials() {
    if (!missingNames().isEmpty()) {
      throw new IllegalStateException(validationMessage());
    }
  }

  public String validationMessage() {
    return "Missing required E2E credentials: " + String.join(", ", missingNames());
  }

  private static void addIfBlank(Set<String> missing, String name, String value) {
    if (value == null || value.isBlank()) {
      missing.add(name);
    }
  }
}
