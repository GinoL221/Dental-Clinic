package com.dh.dentalClinicMVC.authentication;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registration form address. All fields are optional because the register form always posts the
 * address object: empty `location`/`province` as "" and an empty `number` as 0 (see
 * frontend/src/routes/users/register/+page.server.js). A DTO is required here instead of a reuse of
 * {@code AddressRequestDTO}, whose required-field constraints would make registration fail for
 * those default values; the service-layer {@code Address} entity cannot be bound directly because
 * validation {@code @Size}/{@code @PositiveOrZero} must apply to the request, not the entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAddressRequest {

  @Size(max = 255, message = "La calle no puede superar los 255 caracteres")
  private String street;

  @PositiveOrZero(message = "El número debe ser un número positivo")
  private Integer number;

  @Size(max = 255, message = "La localidad no puede superar los 255 caracteres")
  private String location;

  @Size(max = 255, message = "La provincia no puede superar los 255 caracteres")
  private String province;
}
