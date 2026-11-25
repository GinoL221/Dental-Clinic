package com.dh.dentalClinicMVC.support;

import com.dh.dentalClinicMVC.entity.Role;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.security.test.context.support.WithSecurityContext;

/**
 * Test-only stand-in for Spring Security's mock-user test annotation that authenticates the current
 * test with an entity {@code User} principal. Production code only ever produces the entity {@code
 * com.dh.dentalClinicMVC.entity.User} as the security principal; Spring's mock {@code
 * org.springframework.security.core.userdetails.User} never appears at runtime, and the fail-closed
 * principal-type guards in {@code ActiveSessionAuthorizationManager} and {@code JwtService} deny
 * anything else. The entity principal is a drop-in replacement because production code only reads
 * {@code auth.getName()} and {@code User.getAuthorities()} returns {@code ROLE_} + role name.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
@WithSecurityContext(factory = WithMockAppUserSecurityContextFactory.class)
public @interface WithMockAppUser {

  /** Email treated as the principal username, mirroring {@code User.getEmail()}. */
  String username() default "user@test.com";

  /** Role the entity principal carries; drives its single {@code ROLE_X} authority. */
  Role role();
}
