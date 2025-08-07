package com.dh.dentalClinicMVC.dto;

public class AppointmentDTO {

    private Long id;

    private Long dentist_id;

    private Long patient_id;

    private String date;

    private String description;

    public AppointmentDTO() {
    }

    public AppointmentDTO(Long id, Long dentist_id, Long patient_id, String date) {
        this.id = id;
        this.dentist_id = dentist_id;
        this.patient_id = patient_id;
        this.date = date;
        this.description = "";
    }

    public AppointmentDTO(Long id, Long dentist_id, Long patient_id, String date, String description) {
        this.id = id;
        this.dentist_id = dentist_id;
        this.patient_id = patient_id;
        this.date = date;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDentist_id() {
        return dentist_id;
    }

    public void setDentist_id(Long dentist_id) {
        this.dentist_id = dentist_id;
    }

    public Long getPatient_id() {
        return patient_id;
    }

    public void setPatient_id(Long patient_id) {
        this.patient_id = patient_id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
