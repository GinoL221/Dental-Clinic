package com.dh.dentalClinicMVC.authentication;

public record SessionProfileResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String role,
    boolean mustChangePassword) {

  public SessionProfileResponse(
      Long id, String firstName, String lastName, String email, String role) {
    this(id, firstName, lastName, email, role, false);
  }
}
