package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Address;
import java.time.LocalDate;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponseDTO {
  private Long id;
  private String firstName;
  private String lastName;
  private String email;
  private Integer cardIdentity;
  private LocalDate admissionDate;
  private Address address;
}
