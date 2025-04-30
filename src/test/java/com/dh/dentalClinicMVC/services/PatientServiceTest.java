package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.services.impl.IPatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PatientServiceTest {

    @Autowired
    private IPatientService IPatientService;

    @Test
    void findById() {
        Integer idPatient = 1;

        // Buscar al paciente
        Patient patient = IPatientService.findById(idPatient);
        // Verificar que el paciente no sea nulo
        assertNotNull(patient);
    }
}