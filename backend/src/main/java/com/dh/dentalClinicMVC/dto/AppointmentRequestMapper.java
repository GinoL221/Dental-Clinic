package com.dh.dentalClinicMVC.dto;

// Stateless mapping between AppointmentRequestDTO and the service-level
// AppointmentDTO. Lives at the controller boundary; IAppointmentService keeps
// its AppointmentDTO-based signatures unchanged.
public final class AppointmentRequestMapper {

  private AppointmentRequestMapper() {}

  // id is null on create (server-assigned), or the path id on update.
  // status is always left null: create defaults to SCHEDULED server-side,
  // and status changes are only allowed via the guarded PATCH /{id}/status.
  public static AppointmentDTO toServiceDTO(AppointmentRequestDTO dto, Long id) {
    return AppointmentDTO.builder()
        .id(id)
        .dentist_id(dto.getDentistId())
        .patient_id(dto.getPatientId())
        .date(dto.getDate())
        .time(dto.getTime())
        .description(dto.getDescription())
        .status(null)
        .build();
  }
}
