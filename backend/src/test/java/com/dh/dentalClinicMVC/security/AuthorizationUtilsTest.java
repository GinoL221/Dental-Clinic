package com.dh.dentalClinicMVC.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

// Covers design.md Decision 1: static hasRole/hasAnyRole, null-safe on Authentication,
// mirroring AppointmentController's original private hasRole() semantics.
class AuthorizationUtilsTest {

  private static Authentication authWithRole(String role) {
    return new UsernamePasswordAuthenticationToken(
        "user@test.com", null, List.of(new SimpleGrantedAuthority(role)));
  }

  private static Authentication authWithRoles(String... roles) {
    return new UsernamePasswordAuthenticationToken(
        "user@test.com", null, List.of(roles).stream().map(SimpleGrantedAuthority::new).toList());
  }

  @Test
  void hasRole_nullAuthentication_returnsFalse() {
    assertFalse(AuthorizationUtils.hasRole(null, "ROLE_ADMIN"));
  }

  @Test
  void hasRole_matchingRole_returnsTrue() {
    Authentication auth = authWithRole("ROLE_ADMIN");
    assertTrue(AuthorizationUtils.hasRole(auth, "ROLE_ADMIN"));
  }

  @Test
  void hasRole_nonMatchingRole_returnsFalse() {
    Authentication auth = authWithRole("ROLE_PATIENT");
    assertFalse(AuthorizationUtils.hasRole(auth, "ROLE_ADMIN"));
  }

  @Test
  void hasAnyRole_nullAuthentication_returnsFalse() {
    assertFalse(AuthorizationUtils.hasAnyRole(null, "ROLE_ADMIN", "ROLE_DENTIST"));
  }

  @Test
  void hasAnyRole_matchesOneOfSeveral_returnsTrue() {
    Authentication auth = authWithRole("ROLE_DENTIST");
    assertTrue(AuthorizationUtils.hasAnyRole(auth, "ROLE_ADMIN", "ROLE_DENTIST"));
  }

  @Test
  void hasAnyRole_matchesNone_returnsFalse() {
    Authentication auth = authWithRole("ROLE_PATIENT");
    assertFalse(AuthorizationUtils.hasAnyRole(auth, "ROLE_ADMIN", "ROLE_DENTIST"));
  }

  @Test
  void hasRole_multipleAuthoritiesOnPrincipal_matchesEitherRegardlessOfOrder() {
    Authentication authAdminFirst = authWithRoles("ROLE_ADMIN", "ROLE_DENTIST");
    Authentication authDentistFirst = authWithRoles("ROLE_DENTIST", "ROLE_ADMIN");

    assertTrue(AuthorizationUtils.hasRole(authAdminFirst, "ROLE_DENTIST"));
    assertTrue(AuthorizationUtils.hasRole(authDentistFirst, "ROLE_ADMIN"));
  }

  @Test
  void hasAnyRole_multipleAuthoritiesOnPrincipal_matchesTheOneRoleThatOverlaps() {
    Authentication auth = authWithRoles("ROLE_DENTIST", "ROLE_PATIENT");
    assertTrue(AuthorizationUtils.hasAnyRole(auth, "ROLE_ADMIN", "ROLE_PATIENT"));
  }

  @Test
  void hasRole_emptyAuthorities_returnsFalse() {
    Authentication auth = new UsernamePasswordAuthenticationToken("user@test.com", null, List.of());
    assertFalse(AuthorizationUtils.hasRole(auth, "ROLE_ADMIN"));
  }

  @Test
  void hasAnyRole_noRolesRequested_returnsFalse() {
    Authentication auth = authWithRole("ROLE_ADMIN");
    assertFalse(AuthorizationUtils.hasAnyRole(auth));
  }
}
