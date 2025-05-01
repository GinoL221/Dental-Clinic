package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.service.impl.PatientServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PatientServiceTest {

    @Autowired
    private PatientServiceImpl IPatientService;

    @Test
    void findById() {
        Long idPatient = 1;

        // Buscar al paciente
        Patient patient = IPatientService.findById(idPatient);
        // Verificar que el paciente no sea nulo
        assertNotNull(patient);
    }
}