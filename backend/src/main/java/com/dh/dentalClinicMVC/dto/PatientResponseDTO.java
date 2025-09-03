package com.dh.dentalClinicMVC.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
public class PatientResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer cardIdentity;
    private LocalDate admissionDate;
    private String address;

    public PatientResponseDTO() {}

    public PatientResponseDTO(Long id, String firstName, String lastName, String email,
                              Integer cardIdentity, LocalDate admissionDate, String address) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.cardIdentity = cardIdentity;
        this.admissionDate = admissionDate;
        this.address = address;
    }
}
