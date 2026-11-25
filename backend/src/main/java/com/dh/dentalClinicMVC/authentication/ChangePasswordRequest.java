package com.dh.dentalClinicMVC.authentication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {

  @NotBlank(message = "La contraseña actual es requerida")
  // Deliberately no @Size(max = 72): the current password is only compared against the stored
  // hash (never encoded), so a longer value is safe and must not be rejected.
  private String currentPassword;

  @NotBlank(message = "La nueva contraseña es requerida")
  @Size.List({
    @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres"),
    @Size(max = 72, message = "La nueva contraseña no puede superar los 72 caracteres")
  })
  private String newPassword;
}
