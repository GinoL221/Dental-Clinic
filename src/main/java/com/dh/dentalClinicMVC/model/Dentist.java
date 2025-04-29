package com.dh.dentalClinicMVC.model;

public class Dentist {

    private Integer id;
    private Integer registrationNumber;
    private String name;
    private String lastName;

    public Dentist() {
    }

    public Dentist(Integer id, Integer registrationNumber, String name, String lastName) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.name = name;
        this.lastName = lastName;
    }

    public Dentist(Integer registrationNumber, String name, String lastName) {
        this.registrationNumber = registrationNumber;
        this.name = name;
        this.lastName = lastName;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(Integer registrationNumber) {
        this.registrationNumber = registrationNumber;
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
}
