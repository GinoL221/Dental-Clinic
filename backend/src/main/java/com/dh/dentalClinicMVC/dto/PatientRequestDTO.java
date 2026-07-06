package com.dh.dentalClinicMVC.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequestDTO {

  @NotBlank(message = "El nombre es requerido")
  @Size(min = 2, message = "El nombre debe tener al menos 2 caracteres")
  private String firstName;

  @NotBlank(message = "El apellido es requerido")
  @Size(min = 2, message = "El apellido debe tener al menos 2 caracteres")
  private String lastName;

  @NotBlank(message = "El email es requerido")
  @Email(message = "El email debe ser válido")
  private String email;

  @NotNull(message = "El DNI (cardIdentity) es requerido")
  @Positive(message = "El DNI debe ser un número positivo")
  private Integer cardIdentity;

  @NotNull(message = "La fecha de ingreso es requerida")
  private LocalDate admissionDate;

  @Valid private AddressRequestDTO address;

  // Optional: the service derives a default password on create and
  // preserves the existing one on update when omitted.
  private String password;
}
