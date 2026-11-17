package com.dh.dentalClinicMVC.configuration;

import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Policy bean for public portfolio demo mode ({@code app.demo.enabled}). Disabled by default; when
 * enabled, protects the public landing demo accounts from password changes and deletion.
 */
@Component
public class DemoModePolicy {

  private static final Set<String> PROTECTED_DEMO_EMAILS =
      Set.of("admin@dentalclinic.com", "maria.gonzalez@dentalclinic.com", "juan.perez@email.com");

  private final boolean enabled;

  @Autowired
  public DemoModePolicy(@Value("${app.demo.enabled:false}") boolean enabled) {
    this.enabled = enabled;
  }

  public static DemoModePolicy disabled() {
    return new DemoModePolicy(false);
  }

  public boolean isEnabled() {
    return enabled;
  }

  public boolean isProtectedDemoAccount(String email) {
    if (!enabled || email == null) {
      return false;
    }
    return PROTECTED_DEMO_EMAILS.contains(email.trim().toLowerCase(Locale.ROOT));
  }
}
