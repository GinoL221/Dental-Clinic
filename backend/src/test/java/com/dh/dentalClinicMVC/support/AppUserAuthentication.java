package com.dh.dentalClinicMVC.support;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

/**
 * Single construction point for test identity: an entity {@code User} principal wrapped in the same
 * {@link UsernamePasswordAuthenticationToken} shape the production {@code ApplicationConfig} {@code
 * UserDetailsService} produces. Credentials are {@code null} (the runtime token erases them right
 * after authentication) and the password is a non-null placeholder because authorities and name are
 * all production code ever reads.
 */
public final class AppUserAuthentication {

  private AppUserAuthentication() {}

  /**
   * Builds an {@link Authentication} whose principal is the entity {@link User} with the given
   * email and role, {@code mustChangePassword = false} and {@code tokenVersion = 0}.
   */
  public static Authentication of(String username, Role role) {
    User user =
        User.builder()
            .email(username)
            .password("{noop}placeholder-password")
            .role(role)
            .mustChangePassword(false)
            .tokenVersion(0)
            .build();
    return UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities());
  }
}
