package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.*;

import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class UserPasswordPolicyTest {

  private UserPasswordPolicy policy;
  private BCryptPasswordEncoder encoder;

  @BeforeEach
  void setUp() {
    encoder = new BCryptPasswordEncoder();
    policy = new UserPasswordPolicy(encoder);
  }

  @Test
  @DisplayName("Should generate a secure, non-predictable temporary password when none is provided")
  void shouldGenerateSecureRandomTemporaryPassword() {
    // Predictable legacy pattern: "Carlos" + "Rodriguez" + "345"
    String predictablePassword = "CarlosRodriguez345";

    UserPasswordPolicy.PasswordResolution result =
        policy.resolveForCreate(null, "Carlos", "Rodriguez", 12345);

    assertNotNull(result);
    assertNotNull(result.rawPassword());
    assertTrue(
        result.mustChangePassword(), "Account created with temp password must require change");

    // Must NOT be the predictable legacy password
    assertNotEquals(predictablePassword, result.rawPassword());

    // Must be at least 12 characters
    assertTrue(
        result.rawPassword().length() >= 12,
        "Temporary password should have at least 12 characters, but was: "
            + result.rawPassword().length());

    // Must contain uppercase, lowercase, digit, and special character
    assertTrue(
        Pattern.compile("[A-Z]").matcher(result.rawPassword()).find(),
        "Must contain uppercase character");
    assertTrue(
        Pattern.compile("[a-z]").matcher(result.rawPassword()).find(),
        "Must contain lowercase character");
    assertTrue(Pattern.compile("[0-9]").matcher(result.rawPassword()).find(), "Must contain digit");
    assertTrue(
        Pattern.compile("[^A-Za-z0-9]").matcher(result.rawPassword()).find(),
        "Must contain symbol");

    // Encoded password must match the raw temporary password
    assertTrue(encoder.matches(result.rawPassword(), result.encodedPassword()));
  }

  @Test
  @DisplayName("Two consecutive calls for same user must generate different random passwords")
  void shouldGenerateDifferentPasswordsConsecutively() {
    UserPasswordPolicy.PasswordResolution res1 =
        policy.resolveForCreate(null, "Maria", "Gonzalez", 98765);
    UserPasswordPolicy.PasswordResolution res2 =
        policy.resolveForCreate(null, "Maria", "Gonzalez", 98765);

    assertNotEquals(
        res1.rawPassword(), res2.rawPassword(), "Temporary passwords must be random and unique");
  }

  @Test
  @DisplayName("When an explicit password is provided, use it and do not require change")
  void shouldRespectExplicitPassword() {
    String explicit = "MiClaveSegura123!";
    UserPasswordPolicy.PasswordResolution result =
        policy.resolveForCreate(explicit, "Ana", "Díaz", 44556);

    assertNotNull(result);
    assertNull(result.rawPassword(), "Raw password should not be exposed when explicitly provided");
    assertFalse(result.mustChangePassword(), "Explicit password does not require change");
    assertTrue(encoder.matches(explicit, result.encodedPassword()));
  }
}
