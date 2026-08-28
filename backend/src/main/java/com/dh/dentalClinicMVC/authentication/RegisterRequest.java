package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
  @NotBlank(message = "El nombre es requerido")
  @Size(min = 2, message = "El nombre debe tener al menos 2 caracteres")
  private String firstName;

  @NotBlank(message = "El apellido es requerido")
  @Size(min = 2, message = "El apellido debe tener al menos 2 caracteres")
  private String lastName;

  @NotBlank(message = "El email es requerido")
  @Email(message = "El email debe ser válido")
  private String email;

  @NotBlank(message = "La contraseña es requerida")
  @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
  private String password;

  private Role role;

  // Campos específicos para Patient
  @NotNull(message = "El DNI (cardIdentity) es requerido")
  @Positive(message = "El DNI debe ser un número positivo")
  private Integer cardIdentity;

  private LocalDate admissionDate;
  private Address address;

  // Campos específicos para Dentist
  private Integer registrationNumber;
}
