package com.dh.dentalClinicMVC.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DentistResponseDTO {
  private Long id;
  private String firstName;
  private String lastName;
  private String email;
  private Integer registrationNumber;
  private List<SpecialtyResponseDTO> specialties;
  private Boolean mustChangePassword;
  private String temporaryPassword;

  public DentistResponseDTO(
      Long id,
      String firstName,
      String lastName,
      String email,
      Integer registrationNumber,
      List<SpecialtyResponseDTO> specialties) {
    this(id, firstName, lastName, email, registrationNumber, specialties, null, null);
  }
}
