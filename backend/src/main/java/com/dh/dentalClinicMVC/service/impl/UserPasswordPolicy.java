package com.dh.dentalClinicMVC.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserPasswordPolicy {

  private final PasswordEncoder passwordEncoder;

  public UserPasswordPolicy(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  // Password por defecto: nombre + apellido + últimos 3 dígitos del identificador único (DNI o
  // matrícula)
  public String buildDefaultPassword(String firstName, String lastName, Integer uniqueNumber) {
    String fn = firstName != null ? firstName.trim() : "";
    String ln = lastName != null ? lastName.trim() : "";
    String lastThree = "000";
    if (uniqueNumber != null) {
      int num = Math.abs(uniqueNumber % 1000);
      lastThree = String.format("%03d", num);
    }
    return fn + ln + lastThree;
  }

  public String resolveForCreate(
      String rawPassword, String firstName, String lastName, Integer uniqueNumber) {
    String password =
        isBlank(rawPassword)
            ? buildDefaultPassword(firstName, lastName, uniqueNumber)
            : rawPassword;
    return encodeIfNeeded(password);
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
