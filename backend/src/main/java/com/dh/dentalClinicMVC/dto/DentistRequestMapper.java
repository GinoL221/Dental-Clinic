package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Dentist;

// Stateless mapping between DentistRequestDTO and the Dentist entity.
// Lives at the controller boundary; IDentistService keeps its entity-based
// signatures unchanged. toRequestDTO is also reused by the read-only
// validation audit runner.
public final class DentistRequestMapper {

  private DentistRequestMapper() {}

  public static Dentist toEntity(DentistRequestDTO dto) {
    Dentist dentist = new Dentist();
    dentist.setFirstName(dto.getFirstName());
    dentist.setLastName(dto.getLastName());
    dentist.setEmail(dto.getEmail());
    dentist.setRegistrationNumber(dto.getRegistrationNumber());
    dentist.setPassword(dto.getPassword());
    return dentist;
  }

  public static DentistRequestDTO toRequestDTO(Dentist dentist) {
    DentistRequestDTO dto = new DentistRequestDTO();
    dto.setFirstName(dentist.getFirstName());
    dto.setLastName(dentist.getLastName());
    dto.setEmail(dentist.getEmail());
    dto.setRegistrationNumber(dentist.getRegistrationNumber());
    return dto;
  }
}
