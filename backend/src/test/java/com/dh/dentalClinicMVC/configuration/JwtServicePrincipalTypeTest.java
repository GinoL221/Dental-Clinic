package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServicePrincipalTypeTest {

  // 32 raw bytes, base64-encoded: the minimum HS256 key length.
  private static final String BASE64_SECRET = "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=";

  private JwtService jwtService;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService();
    ReflectionTestUtils.setField(jwtService, "secretKey", BASE64_SECRET);
  }

  private static User entityUser() {
    User user = new User();
    user.setEmail("patient@dentalclinic.com");
    user.setRole(Role.PATIENT);
    user.setTokenVersion(2);
    return user;
  }

  @Test
  void nonEntityPrincipalIsRejectedFailClosed() {
    // Revocation is enforced by comparing the `tv` claim against the entity's
    // tokenVersion. A principal that is not the entity has no tokenVersion to compare, so
    // accepting it would silently skip revocation. Fail closed instead.
    UserDetails genericPrincipal =
        org.springframework.security.core.userdetails.User.withUsername("patient@dentalclinic.com")
            .password("irrelevant")
            .authorities("ROLE_PATIENT")
            .build();

    String token = jwtService.generateToken(genericPrincipal);

    assertFalse(jwtService.isTokenValid(token, genericPrincipal));
  }

  @Test
  void entityUserWithMatchingTokenVersionIsAccepted() {
    // Guard for the behaviour that must keep working: a real entity principal whose `tv`
    // claim matches the current tokenVersion stays valid.
    User user = entityUser();

    String token = jwtService.generateToken(user);

    assertTrue(jwtService.isTokenValid(token, user));
  }

  @Test
  void entityUserAfterTokenVersionBumpIsRejected() {
    User user = entityUser();
    String token = jwtService.generateToken(user);

    user.setTokenVersion(3);

    assertFalse(jwtService.isTokenValid(token, user));
  }
}
