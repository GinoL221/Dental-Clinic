package com.dh.dentalClinicMVC.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

  @JsonProperty("dentist_id")
  public Long getDentist_id() {
    return dentistId;
  }

  @JsonProperty("dentist_id")
  public void setDentist_id(Long dentist_id) {
    this.dentistId = dentist_id;
  }

  @JsonProperty("patient_id")
  public Long getPatient_id() {
    return patientId;
  }

  @JsonProperty("patient_id")
  public void setPatient_id(Long patient_id) {
    this.patientId = patient_id;
  }

  public static class AppointmentDTOBuilder {
    public AppointmentDTOBuilder dentist_id(Long dentist_id) {
      this.dentistId = dentist_id;
      return this;
    }

    public AppointmentDTOBuilder patient_id(Long patient_id) {
      this.patientId = patient_id;
      return this;
    }
  }
}
