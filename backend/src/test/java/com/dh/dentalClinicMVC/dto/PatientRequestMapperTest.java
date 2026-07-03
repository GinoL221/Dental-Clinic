package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Patient;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

// Plain JUnit, no Spring context: PatientRequestMapper is a stateless static
// utility, so a full application context is unnecessary overhead here.
class PatientRequestMapperTest {

    @Test
    void toEntity_mapsAllFieldsIncludingAddress() {
        AddressRequestDTO addressDto = new AddressRequestDTO("Main St", 123, "Springfield", "Buenos Aires");
        PatientRequestDTO dto = new PatientRequestDTO(
                "John", "Doe", "john@example.com", 12345678,
                LocalDate.of(2024, 1, 1), addressDto, "secret");

        Patient patient = PatientRequestMapper.toEntity(dto);

        assertEquals("John", patient.getFirstName());
        assertEquals("Doe", patient.getLastName());
        assertEquals("john@example.com", patient.getEmail());
        assertEquals(12345678, patient.getCardIdentity());
        assertEquals(LocalDate.of(2024, 1, 1), patient.getAdmissionDate());
        assertEquals("secret", patient.getPassword());
        assertNotNull(patient.getAddress());
        assertEquals("Main St", patient.getAddress().getStreet());
        assertEquals(123, patient.getAddress().getNumber());
        assertEquals("Springfield", patient.getAddress().getLocation());
        assertEquals("Buenos Aires", patient.getAddress().getProvince());
    }

    @Test
    void toEntity_withNullAddress_mapsNullAddress() {
        PatientRequestDTO dto = new PatientRequestDTO(
                "Jane", "Doe", "jane@example.com", 87654321,
                LocalDate.of(2023, 5, 10), null, null);

        Patient patient = PatientRequestMapper.toEntity(dto);

        assertNull(patient.getAddress());
    }

    @Test
    void toRequestDTO_mapsAllFieldsIncludingAddress() {
        Address address = new Address();
        address.setStreet("Elm St");
        address.setNumber(45);
        address.setLocation("Rosario");
        address.setProvince("Santa Fe");

        Patient patient = new Patient();
        patient.setFirstName("Alice");
        patient.setLastName("Smith");
        patient.setEmail("alice@example.com");
        patient.setCardIdentity(11223344);
        patient.setAdmissionDate(LocalDate.of(2022, 3, 3));
        patient.setAddress(address);

        PatientRequestDTO dto = PatientRequestMapper.toRequestDTO(patient);

        assertEquals("Alice", dto.getFirstName());
        assertEquals("Smith", dto.getLastName());
        assertEquals("alice@example.com", dto.getEmail());
        assertEquals(11223344, dto.getCardIdentity());
        assertEquals(LocalDate.of(2022, 3, 3), dto.getAdmissionDate());
        assertNotNull(dto.getAddress());
        assertEquals("Elm St", dto.getAddress().getStreet());
        assertEquals(45, dto.getAddress().getNumber());
        assertEquals("Rosario", dto.getAddress().getLocation());
        assertEquals("Santa Fe", dto.getAddress().getProvince());
    }

    @Test
    void toRequestDTO_withNullAddress_mapsNullAddress() {
        Patient patient = new Patient();
        patient.setFirstName("Bob");
        patient.setLastName("Jones");
        patient.setEmail("bob@example.com");
        patient.setCardIdentity(55667788);
        patient.setAdmissionDate(LocalDate.of(2021, 6, 6));

        PatientRequestDTO dto = PatientRequestMapper.toRequestDTO(patient);

        assertNull(dto.getAddress());
    }
}
