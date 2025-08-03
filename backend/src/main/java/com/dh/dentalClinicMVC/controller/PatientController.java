package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.impl.PatientServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private PatientServiceImpl iPatientService;

    @Autowired
    public PatientController(PatientServiceImpl iPatientService) {
        this.iPatientService = iPatientService;
    }

    // Endpoint que nos permite agregar un paciente
    @PostMapping
    public ResponseEntity<Patient> save(@RequestBody Patient patient) {
        return ResponseEntity.ok(iPatientService.save(patient));
    }

    // Endpoint que nos permite actualizar un paciente
    @PutMapping
    public ResponseEntity<String> update(@RequestBody Patient patient) {
        ResponseEntity<String> response;
        Optional<Patient> patientOptional = iPatientService.findById(patient.getId());

        if (patientOptional.isPresent()) {
            iPatientService.update(patient);
            response = ResponseEntity.ok("Paciente actualizado correctamente");
        } else {
            response = ResponseEntity.badRequest().body("El paciente no se puede actualizar " +
                    "porque no existe en la base de datos");
        }
        return response;
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
        iPatientService.delete(id);
        return ResponseEntity.ok("Se elimino el paciente con id: " + id);
    }

    // Endpoint que nos permite buscar un paciente por ID
    @GetMapping("/{id}")
    public ResponseEntity<Patient> findById(@PathVariable Long id) {
        Optional<Patient> patient = iPatientService.findById(id);

        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        } else {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Endpoint que nos permite devolver todos los pacientes
    @GetMapping
    public List<Patient> findAll() {
        return iPatientService.findAll();
    }
}