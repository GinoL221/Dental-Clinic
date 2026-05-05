package com.dh.dentalClinicMVC.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DentistResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer registrationNumber;
    private List<SpecialtyDTO> specialties;
}