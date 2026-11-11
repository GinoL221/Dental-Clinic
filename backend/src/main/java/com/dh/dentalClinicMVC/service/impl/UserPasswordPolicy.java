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
      return new PasswordResolution(tempPassword, encodeIfNeeded(tempPassword), true);
    }
    return new PasswordResolution(null, encodeIfNeeded(rawPassword), false);
  }

  public String resolveForUpdate(String rawPassword, String existingEncodedPassword) {
    return isBlank(rawPassword) ? existingEncodedPassword : encodeIfNeeded(rawPassword);
  }

  private String encodeIfNeeded(String password) {
    return password.startsWith("$2a$") ? password : passwordEncoder.encode(password);
  }

  private boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }
}
