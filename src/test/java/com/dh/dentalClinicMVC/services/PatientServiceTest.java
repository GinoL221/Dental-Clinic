package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.model.Patient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PatientServiceTest {

    @Autowired
    private PatientService patientService;

    @Test
    void findById() {
        Integer idPatient = 1;

        // Buscar al paciente
        Patient patient = patientService.findById(idPatient);
        // Verificar que el paciente no sea nulo
        assertNotNull(patient);
    }
}