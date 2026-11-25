package com.dh.dentalClinicMVC.security;

import com.dh.dentalClinicMVC.entity.User;
import java.util.function.Supplier;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

/**
 * Default authorization rule for every protected route: the request must be backed by an
 * authenticated, fully provisioned session.
 *
 * <p>Rejects a missing authentication, an anonymous token, and an entity {@link User} whose {@code
 * mustChangePassword} quarantine is still active. Extracted from {@code SecurityConfiguration} so
 * the quarantine semantics are unit-testable without a Spring context.
 */
public final class ActiveSessionAuthorizationManager
    implements AuthorizationManager<RequestAuthorizationContext> {

  @Override
  public AuthorizationDecision authorize(
      Supplier<? extends Authentication> authentication, RequestAuthorizationContext context) {
    Authentication current = authentication.get();
    if (current == null
        || !current.isAuthenticated()
        || current instanceof AnonymousAuthenticationToken) {
      return new AuthorizationDecision(false);
    }
    // Fail closed: entity-backed guarantees (the mustChangePassword quarantine, token
    // revocation, role derivation) can only be evaluated for the entity User. A principal
    // of any other type must not be waved through.
    if (!(current.getPrincipal() instanceof User user)) {
      return new AuthorizationDecision(false);
    }
    if (user.isMustChangePassword()) {
      return new AuthorizationDecision(false);
    }
    return new AuthorizationDecision(true);
  }
}
