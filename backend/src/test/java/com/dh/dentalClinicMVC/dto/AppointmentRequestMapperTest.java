package com.dh.dentalClinicMVC.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

// Plain JUnit, no Spring context: AppointmentRequestMapper is a stateless
// static utility, so a full application context is unnecessary overhead here.
class AppointmentRequestMapperTest {

    @Test
    void toServiceDTO_onCreate_mapsFieldsAndLeavesIdAndStatusNull() {
        AppointmentRequestDTO dto = new AppointmentRequestDTO(
                1L, 2L, "2026-08-10", "10:30", "Limpieza dental");

        AppointmentDTO result = AppointmentRequestMapper.toServiceDTO(dto, null);

        assertNull(result.getId());
        assertEquals(1L, result.getDentist_id());
        assertEquals(2L, result.getPatient_id());
        assertEquals("2026-08-10", result.getDate());
        assertEquals("10:30", result.getTime());
        assertEquals("Limpieza dental", result.getDescription());
        assertNull(result.getStatus());
    }

    @Test
    void toServiceDTO_onUpdate_usesPathIdAndDifferentFieldValues() {
        AppointmentRequestDTO dto = new AppointmentRequestDTO(
                5L, 9L, "2026-09-01", "14:00", null);

        AppointmentDTO result = AppointmentRequestMapper.toServiceDTO(dto, 42L);

        assertEquals(42L, result.getId());
        assertEquals(5L, result.getDentist_id());
        assertEquals(9L, result.getPatient_id());
        assertEquals("2026-09-01", result.getDate());
        assertEquals("14:00", result.getTime());
        assertNull(result.getDescription());
        assertNull(result.getStatus());
    }
}
