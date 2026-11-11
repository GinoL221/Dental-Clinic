package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Address;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PatientResponseDTO {
  private Long id;
  private String firstName;
  private String lastName;
  private String email;
  private Integer cardIdentity;
  private LocalDate admissionDate;
  private Address address;
  private Boolean mustChangePassword;
  private String temporaryPassword;

  public PatientResponseDTO(
      Long id,
      String firstName,
      String lastName,
      String email,
      Integer cardIdentity,
      LocalDate admissionDate,
      Address address) {
    this(id, firstName, lastName, email, cardIdentity, admissionDate, address, null, null);
  }
}
