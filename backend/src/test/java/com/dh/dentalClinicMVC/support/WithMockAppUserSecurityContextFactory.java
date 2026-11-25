package com.dh.dentalClinicMVC.support;

import com.dh.dentalClinicMVC.entity.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

/**
 * Builds a {@link SecurityContext} for {@link WithMockAppUser}. The principal is constructed in one
 * place — {@link AppUserAuthentication#of(String, Role)} — so the annotation factory and the
 * request post-processor replacement cannot drift apart.
 */
public class WithMockAppUserSecurityContextFactory
    implements WithSecurityContextFactory<WithMockAppUser> {

  @Override
  public SecurityContext createSecurityContext(WithMockAppUser annotation) {
    Authentication authentication =
        AppUserAuthentication.of(annotation.username(), annotation.role());
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    return context;
  }
}
