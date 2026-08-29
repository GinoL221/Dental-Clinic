package com.dh.dentalClinicMVC.exception;

// Marks an EXISTING users row whose `role` column is null — distinct from
// StalePrincipalException ("no backing row"). Same uniform 401 on the wire; the
// separate type exists for code clarity and operator logs. See design.md A5.
public class InvalidPrincipalRoleException extends RuntimeException {
  public InvalidPrincipalRoleException() {
    super();
  }
}
