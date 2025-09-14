package com.dh.dentalClinicMVC.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DentistResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer registrationNumber;
}