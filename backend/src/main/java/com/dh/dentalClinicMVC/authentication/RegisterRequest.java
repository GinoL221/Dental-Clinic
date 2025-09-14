package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Role role;

    // Campos específicos para Patient
    private Integer cardIdentity;
    private LocalDate admissionDate;
    private Address address;

    // Campos específicos para Dentist
    private Integer registrationNumber;
}
