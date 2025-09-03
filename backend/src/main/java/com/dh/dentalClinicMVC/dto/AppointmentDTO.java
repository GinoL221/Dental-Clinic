package com.dh.dentalClinicMVC.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AppointmentDTO {
    private Long id;
    private Long dentist_id;
    private Long patient_id;
    private String date;
    private String time;
    private String description;
    private String status;

    public AppointmentDTO() {
    }

    public AppointmentDTO(Long id, Long dentist_id, Long patient_id, String date, String time, String description,
            String status) {
        this.id = id;
        this.dentist_id = dentist_id;
        this.patient_id = patient_id;
        this.date = date;
        this.time = time;
        this.description = description;
        this.status = status;
    }

    public AppointmentDTO(Long id, Long dentist_id, Long patient_id, String date) {
        this(id, dentist_id, patient_id, date, "", null, "SCHEDULED");
    }
}
