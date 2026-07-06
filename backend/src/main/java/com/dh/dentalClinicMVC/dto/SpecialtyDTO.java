package com.dh.dentalClinicMVC.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpecialtyDTO {
  private Long id;

  @NotBlank(message = "El nombre de la especialidad no puede estar vacío")
  private String name;

  private String description;
}
