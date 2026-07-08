package com.dh.dentalClinicMVC.exception;

// Marks a valid, unexpired JWT whose principal has no backing row (users/Patient/Dentist)
// at the controller/service layer ("stale principal"). GlobalExceptionHandler maps this to a
// single uniform 401 response regardless of which lookup missed — see design.md Decision 2.
public class StalePrincipalException extends RuntimeException {
  public StalePrincipalException() {
    super();
  }
}
