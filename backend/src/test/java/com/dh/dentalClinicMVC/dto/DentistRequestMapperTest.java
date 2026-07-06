package com.dh.dentalClinicMVC.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.dh.dentalClinicMVC.entity.Dentist;
import org.junit.jupiter.api.Test;

// Plain JUnit, no Spring context: DentistRequestMapper is a stateless static
// utility, so a full application context is unnecessary overhead here.
class DentistRequestMapperTest {

  @Test
  void toEntity_mapsAllFields() {
    DentistRequestDTO dto =
        new DentistRequestDTO("John", "Doe", "john@example.com", 12345, "secret");

    Dentist dentist = DentistRequestMapper.toEntity(dto);

    assertEquals("John", dentist.getFirstName());
    assertEquals("Doe", dentist.getLastName());
    assertEquals("john@example.com", dentist.getEmail());
    assertEquals(12345, dentist.getRegistrationNumber());
    assertEquals("secret", dentist.getPassword());
  }

  @Test
  void toRequestDTO_mapsAllFields() {
    Dentist dentist = new Dentist();
    dentist.setFirstName("Alice");
    dentist.setLastName("Smith");
    dentist.setEmail("alice@example.com");
    dentist.setRegistrationNumber(54321);

    DentistRequestDTO dto = DentistRequestMapper.toRequestDTO(dentist);

    assertEquals("Alice", dto.getFirstName());
    assertEquals("Smith", dto.getLastName());
    assertEquals("alice@example.com", dto.getEmail());
    assertEquals(54321, dto.getRegistrationNumber());
  }
}
