package com.dh.dentalClinicMVC.dto;

import jdk.jshell.Snippet;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {
    private Long id;
    private Long dentist_id;
    private Long patient_id;
    private String date;
    private String time;
    private String description;
    private String status;

    public AppointmentDTO(Long id, Long dentist_id, Long patient_id, String date) {
        this(id, dentist_id, patient_id, date, "", null, "SCHEDULED");
    }
}
