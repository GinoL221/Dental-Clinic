package com.dh.dentalClinicMVC.model;

import java.time.LocalDate;

public class Patient {

    private Integer id;
    private String name;
    private String lastName;
    private String email;
    private Integer cardIdentity;
    private LocalDate admissionDate;
    private Address address;

    public Patient() {
    }

    public Patient(Integer id, String name, String lastName, String email, Integer cardIdentity, LocalDate admissionDate, Address address) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.cardIdentity = cardIdentity;
        this.admissionDate = admissionDate;
        this.address = address;
    }

    public Patient(String name, String lastName, String email, Integer cardIdentity, LocalDate admissionDate, Address address) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.cardIdentity = cardIdentity;
        this.admissionDate = admissionDate;
        this.address = address;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
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

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
