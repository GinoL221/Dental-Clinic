package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.model.Patient;
import com.dh.dentalClinicMVC.services.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private PatientService patientService;

    @Autowired
    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    // Endpoint que nos permite agregar un paciente
    @PostMapping
    public Patient save(@RequestBody Patient patient) {
        return patientService.save(patient);
    }

    // Endpoint que nos permite actualizar un paciente
    @PutMapping
    public void update(@RequestBody Patient patient) {
        patientService.update(patient);
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        patientService.delete(id);
    }

    // Endpoint que nos permite buscar un paciente por ID
    @GetMapping("/{id}")
    public Patient findById(@PathVariable Integer id) {
        return patientService.findById(id);
    }

    // Endpoint que nos permite devolver todos los pacientes
    @GetMapping
    public List<Patient> findAll() {
        return patientService.findAll();
    }
}