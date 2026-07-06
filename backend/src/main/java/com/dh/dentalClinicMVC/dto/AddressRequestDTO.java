package com.dh.dentalClinicMVC.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequestDTO {

  @NotBlank(message = "La calle es requerida")
  private String street;

  @NotNull(message = "El número es requerido")
  @Positive(message = "El número debe ser positivo")
  private Integer number;

  @NotBlank(message = "La localidad es requerida")
  private String location;

  @NotBlank(message = "La provincia es requerida")
  private String province;
}
