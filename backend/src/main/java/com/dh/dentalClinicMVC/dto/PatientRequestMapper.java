package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Patient;

// Stateless mapping between PatientRequestDTO and the Patient entity.
// Lives at the controller boundary; IPatientService keeps its entity-based
// signatures unchanged. toRequestDTO is also reused by the read-only
// validation audit runner.
public final class PatientRequestMapper {

  private PatientRequestMapper() {}

  public static Patient toEntity(PatientRequestDTO dto) {
    Patient patient = new Patient();
    patient.setFirstName(dto.getFirstName());
    patient.setLastName(dto.getLastName());
    patient.setEmail(dto.getEmail());
    patient.setCardIdentity(dto.getCardIdentity());
    patient.setAdmissionDate(dto.getAdmissionDate());
    patient.setPassword(dto.getPassword());
    patient.setAddress(toAddressEntity(dto.getAddress()));
    return patient;
  }

  public static PatientRequestDTO toRequestDTO(Patient patient) {
    PatientRequestDTO dto = new PatientRequestDTO();
    dto.setFirstName(patient.getFirstName());
    dto.setLastName(patient.getLastName());
    dto.setEmail(patient.getEmail());
    dto.setCardIdentity(patient.getCardIdentity());
    dto.setAdmissionDate(patient.getAdmissionDate());
    dto.setAddress(toAddressDTO(patient.getAddress()));
    return dto;
  }

  private static Address toAddressEntity(AddressRequestDTO dto) {
    if (dto == null) {
      return null;
    }
    Address address = new Address();
    address.setStreet(dto.getStreet());
    address.setNumber(dto.getNumber());
    address.setLocation(dto.getLocation());
    address.setProvince(dto.getProvince());
    return address;
  }

  private static AddressRequestDTO toAddressDTO(Address address) {
    if (address == null) {
      return null;
    }
    return new AddressRequestDTO(
        address.getStreet(), address.getNumber(), address.getLocation(), address.getProvince());
  }
}
