package com.dh.dentalClinicMVC.service.impl;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserPasswordPolicy {

  private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
  private static final String DIGITS = "23456789";
  private static final String SYMBOLS = "!@#$%&*+?-_=";
  private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS;
  private static final int DEFAULT_TEMP_PASSWORD_LENGTH = 14;

  private final PasswordEncoder passwordEncoder;
  private final SecureRandom random = new SecureRandom();

  public UserPasswordPolicy(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  public record PasswordResolution(
      String rawPassword, String encodedPassword, boolean mustChangePassword) {}

  public String generateSecureTemporaryPassword() {
    List<Character> chars = new ArrayList<>(DEFAULT_TEMP_PASSWORD_LENGTH);
    chars.add(UPPER.charAt(random.nextInt(UPPER.length())));
    chars.add(LOWER.charAt(random.nextInt(LOWER.length())));
    chars.add(DIGITS.charAt(random.nextInt(DIGITS.length())));
    chars.add(SYMBOLS.charAt(random.nextInt(SYMBOLS.length())));

    for (int i = 4; i < DEFAULT_TEMP_PASSWORD_LENGTH; i++) {
      chars.add(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
    }

    Collections.shuffle(chars, random);

    StringBuilder sb = new StringBuilder(DEFAULT_TEMP_PASSWORD_LENGTH);
    for (char c : chars) {
      sb.append(c);
    }
    return sb.toString();
  }

  public PasswordResolution resolveForCreate(
      String rawPassword, String firstName, String lastName, Integer uniqueNumber) {
    if (isBlank(rawPassword)) {
      String tempPassword = generateSecureTemporaryPassword();
      return new PasswordResolution(tempPassword, passwordEncoder.encode(tempPassword), true);
    }
    // Always re-encode the supplied value: a bcrypt-shaped input treated as an already-encoded
    // hash would let a caller plant a hash whose preimage they know.
    return new PasswordResolution(null, passwordEncoder.encode(rawPassword), false);
  }

  /**
   * Blank raw keeps the stored hash unchanged; the same password re-submitted keeps it too (no-op
   * detected by matching, not by hash-prefix guessing); anything else is re-encoded so a
   * client-supplied bcrypt-shaped value is never stored verbatim (it would let the caller plant a
   * hash whose preimage they know).
   */
  public String resolveForUpdate(String rawPassword, String existingEncodedPassword) {
    if (isBlank(rawPassword)) {
      return existingEncodedPassword;
    }
    if (existingEncodedPassword != null
        && passwordEncoder.matches(rawPassword, existingEncodedPassword)) {
      return existingEncodedPassword;
    }
    return passwordEncoder.encode(rawPassword);
  }

  private boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }
}
