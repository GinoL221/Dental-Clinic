package com.dh.dentalClinicMVC.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {
  private Long id;
  private Long dentistId;
  private Long patientId;
  private String date;
  private String time;
  private String description;
  private String status;

  public AppointmentDTO(Long id, Long dentistId, Long patientId, String date) {
    this(id, dentistId, patientId, date, "", null, "SCHEDULED");
  }
}
