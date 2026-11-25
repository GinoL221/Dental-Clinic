package com.dh.dentalClinicMVC.exception;

/**
 * T5 (auth-security-hardening S1): a PATIENT or DENTIST sent a password in the self-update of their
 * own record (`PUT /patients/{id}` / `PUT /dentists/{id}`). Password rotation goes through `POST
 * /auth/change-password`, so the request is rejected with 400 and nothing is persisted.
 */
public class PasswordChangeNotAllowedException extends RuntimeException {
  public PasswordChangeNotAllowedException() {
    super("Password changes must go through /auth/change-password");
  }
}
