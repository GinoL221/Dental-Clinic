package com.dh.dentalClinicMVC.dto;

import java.time.LocalDate;

public class PatientResponseDTO {
    private Long id;
    private String name;
    private String lastName;
    private String email;
    private Integer cardIdentity;
    private LocalDate admissionDate;
    private String address;

    public PatientResponseDTO() {}

    public PatientResponseDTO(Long id, String name, String lastName, String email, 
                             Integer cardIdentity, LocalDate admissionDate, String address) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.cardIdentity = cardIdentity;
        this.admissionDate = admissionDate;
        this.address = address;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getCardIdentity() {
        return cardIdentity;
    }

    public void setCardIdentity(Integer cardIdentity) {
        this.cardIdentity = cardIdentity;
    }

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
