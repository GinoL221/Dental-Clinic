package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Client-supplied bcrypt-shaped values must always be re-encoded (never stored verbatim): storing
 * the input as-is would let a caller plant a hash whose preimage they already know.
 */
class UserPasswordPolicyEncodingTest {

  /** Real bcrypt hash literal from src/main/resources/import.sql, used for shape only. */
  private static final String IMPORT_SQL_HASH =
      "$2a$10$CwTycUXWue0Thq9StjUM0uBUcpkmhBr.4NQJZ6lq3ZUklA.J5eOzq";

  private UserPasswordPolicy policy;
  private BCryptPasswordEncoder encoder;

  @BeforeEach
  void setUp() {
    encoder = new BCryptPasswordEncoder();
    policy = new UserPasswordPolicy(encoder);
  }

  @Test
  @DisplayName("resolveForCreate: explicit $2a$-shaped password is treated as raw and hashed")
  void resolveForCreateHashesBcryptShapedInput$2a() {
    assertReencodedOnCreate(IMPORT_SQL_HASH);
  }

  @ParameterizedTest
  @ValueSource(strings = {"$2b$", "$2y$"})
  @DisplayName("resolveForCreate: $2b$- and $2y$-shaped passwords are treated as raw and hashed")
  void resolveForCreateHashesBcryptShapedInputOtherPrefixes(String prefix) {
    String shaped = prefix + "10$" + "CwTycUXWue0Thq9StjUM0uBUcpkmhBr.4NQJZ6lq3ZUklA.J5eOzq";
    assertTrue(shaped.length() == 60);
    assertReencodedOnCreate(shaped);
  }

  private void assertReencodedOnCreate(String shapedInput) {
    UserPasswordPolicy.PasswordResolution result =
        policy.resolveForCreate(shapedInput, "Test", "User", 1);

    assertNull(result.rawPassword());
    assertNotEquals(shapedInput, result.encodedPassword());
    assertTrue(encoder.matches(shapedInput, result.encodedPassword()));
  }

  @Test
  @DisplayName("resolveForUpdate: blank raw keeps the existing encoded password unchanged")
  void resolveForUpdateWithBlankRawReturnsExisting() {
    String existing = encoder.encode("existingSecret123!");
    assertSame(existing, policy.resolveForUpdate(null, existing));
    assertSame(existing, policy.resolveForUpdate("   ", existing));
  }

  @Test
  @DisplayName("resolveForUpdate: re-submitting the current password is a no-op")
  void resolveForUpdateWithMatchingRawReturnsExistingHashVerbatim() {
    String existing = encoder.encode("admin123");
    assertSame(existing, policy.resolveForUpdate("admin123", existing));
  }

  @Test
  @DisplayName("resolveForUpdate: a different raw is re-encoded")
  void resolveForUpdateWithDifferentRawReturnsNewHash() {
    String existing = encoder.encode("admin123");
    String raw = "aBrandNewSecret999!";

    String stored = policy.resolveForUpdate(raw, existing);

    assertNotEquals(existing, stored);
    assertTrue(encoder.matches(raw, stored));
  }

  @Test
  @DisplayName("resolveForUpdate: a bcrypt-shaped raw is re-encoded, never stored verbatim")
  void resolveForUpdateWithBcryptShapedRawIsReencoded() {
    String existing = encoder.encode("admin123");

    String stored = policy.resolveForUpdate(IMPORT_SQL_HASH, existing);

    assertNotEquals(IMPORT_SQL_HASH, stored);
    assertNotEquals(existing, stored);
    assertTrue(encoder.matches(IMPORT_SQL_HASH, stored));
  }

  @Test
  @DisplayName("resolveForUpdate: null existing hash with a raw is encoded")
  void resolveForUpdateWithNullExistingEncodesRaw() {
    String raw = "someSecret123!";

    String stored = policy.resolveForUpdate(raw, null);

    assertNotEquals(raw, stored);
    assertTrue(encoder.matches(raw, stored));
  }
}
