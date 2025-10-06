package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.impl.PatientServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientServiceImpl patientService;

    @Autowired
    public PatientController(PatientServiceImpl patientService) {
        this.patientService = patientService;
    }

    // Endpoint que nos permite agregar un paciente
    @PostMapping
    public ResponseEntity<PatientResponseDTO> save(@Valid @RequestBody Patient patient) {
        if (patient.getEmail() != null && patientService.existsByEmail(patient.getEmail())) {
            return ResponseEntity.status(409).build();
        }
        if (patient.getCardIdentity() != null && patientService.existsByCardIdentity(patient.getCardIdentity())) {
            return ResponseEntity.status(409).build();
        }
        Patient saved = patientService.save(patient);
        PatientResponseDTO dto = patientService.findByIdAsDTO(saved.getId());
        return ResponseEntity.status(201).body(dto);
    }

    // Endpoint que nos permite actualizar un paciente
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN') or #patient.email == authentication.name")
    public ResponseEntity<String> update(@RequestBody Patient patient) {
        if (patient == null || patient.getId() == null) {
            return ResponseEntity.badRequest().body("El ID del paciente es requerido para la actualización");
        }
        Optional<Patient> patientOptional = patientService.findById(patient.getId());
        if (patientOptional.isPresent()) {
            patientService.update(patient);
            return ResponseEntity.ok("Paciente actualizado correctamente");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
        try {
            patientService.delete(id);
            return ResponseEntity.ok("Se eliminó el paciente con id: " + id);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar el paciente: " + e.getMessage());
        }
    }

    // Endpoint que nos permite buscar un paciente por ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponseDTO> findById(@PathVariable Long id) {
        PatientResponseDTO dto = patientService.findByIdAsDTO(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    // Endpoint que nos permite devolver todos los pacientes (sin datos sensibles)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public List<PatientResponseDTO> findAll() {
        return patientService.findAllAsDTO();
    }

    // Endpoint para verificar si un email ya está registrado
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = patientService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    // Endpoint para verificar que un cardIdentity ya esté registrado
    @GetMapping("/check-card-identity")
    public ResponseEntity<Boolean> checkCardIdentityExists(@RequestParam Integer cardIdentity) {
        boolean exists = patientService.findByCardIdentity(cardIdentity).isPresent();
        return ResponseEntity.ok(exists);
    }
}