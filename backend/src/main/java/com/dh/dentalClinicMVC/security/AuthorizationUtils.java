package com.dh.dentalClinicMVC.security;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.Authentication;

// Static, stateless role-check helper. See design.md Decision 1: extracted from
// AppointmentController's former private hasRole(), null-safe on Authentication,
// no DI ceremony needed for a pure function.
public final class AuthorizationUtils {

  private AuthorizationUtils() {}

  public static boolean hasRole(@Nullable Authentication auth, String role) {
    return auth != null
        && auth.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()));
  }

  public static boolean hasAnyRole(@Nullable Authentication auth, String... roles) {
    for (String role : roles) {
      if (hasRole(auth, role)) {
        return true;
      }
    }
    return false;
  }
}
