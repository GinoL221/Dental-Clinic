package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.impl.PatientServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('ADMIN') or #patient.user.email == authentication.name")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
        try {
            iPatientService.delete(id);
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
        PatientResponseDTO patient = iPatientService.findByIdAsDTO(id);

        if (patient != null) {
            return ResponseEntity.ok(patient);
        } else {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Endpoint que nos permite devolver todos los pacientes (sin datos sensibles)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public List<PatientResponseDTO> findAll() {
        return iPatientService.findAllAsDTO();
    }

    // Endpoint para verificar si un email ya está registrado
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = iPatientService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    // Endpoint para verificar que un cardIdentity ya esté registrado
    @GetMapping("/check-card-identity")
    public ResponseEntity<Boolean> checkCardIdentityExists(@RequestParam Integer cardIdentity) {
        boolean exists = iPatientService.findByCardIdentity(cardIdentity).isPresent();
        return ResponseEntity.ok(exists);
    }
}