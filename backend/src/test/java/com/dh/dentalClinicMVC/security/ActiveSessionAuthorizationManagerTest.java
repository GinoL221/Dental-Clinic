package com.dh.dentalClinicMVC.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

class ActiveSessionAuthorizationManagerTest {

  private final ActiveSessionAuthorizationManager manager = new ActiveSessionAuthorizationManager();

  private AuthorizationDecision decide(Authentication authentication) {
    return manager.authorize(() -> authentication, null);
  }

  private static Authentication authenticatedAs(Object principal) {
    return new UsernamePasswordAuthenticationToken(
        principal, null, List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));
  }

  private static User activeEntityUser() {
    User user = new User();
    user.setEmail("patient@dentalclinic.com");
    user.setRole(Role.PATIENT);
    user.setMustChangePassword(false);
    return user;
  }

  @Test
  void nonEntityPrincipalIsDeniedFailClosed() {
    // A future second UserDetailsService (LDAP, OAuth2, another provider) would hand the
    // chain a principal that is NOT the entity User. The quarantine and every other
    // entity-backed guarantee cannot be evaluated for it, so it must fail closed instead of
    // being waved through.
    UserDetails genericPrincipal =
        org.springframework.security.core.userdetails.User.withUsername("patient@dentalclinic.com")
            .password("irrelevant")
            .authorities("ROLE_PATIENT")
            .build();

    assertFalse(decide(authenticatedAs(genericPrincipal)).isGranted());
  }

  @Test
  void entityUserOutsideTheQuarantineIsGranted() {
    assertTrue(decide(authenticatedAs(activeEntityUser())).isGranted());
  }

  @Test
  void entityUserInsideTheQuarantineIsDenied() {
    User user = activeEntityUser();
    user.setMustChangePassword(true);

    assertFalse(decide(authenticatedAs(user)).isGranted());
  }

  @Test
  void anonymousAuthenticationIsDenied() {
    assertFalse(decide(null).isGranted());
  }
}
