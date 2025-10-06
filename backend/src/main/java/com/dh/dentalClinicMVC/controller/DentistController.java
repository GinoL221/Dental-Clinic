package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.impl.DentistServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/dentists")
public class DentistController {

    private final DentistServiceImpl dentistService;

    @Autowired
    public DentistController(DentistServiceImpl dentistService) {
        this.dentistService = dentistService;
    }

    // Endpoint que nos permite agregar un dentista
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> save(@Valid @RequestBody Dentist dentist) {
        try {
            if (dentist.getEmail() != null && dentistService.existsByEmail(dentist.getEmail())) {
                return ResponseEntity.status(409).build();
            }
            if (dentist.getRegistrationNumber() != null && dentistService.existsByRegistrationNumber(dentist.getRegistrationNumber())) {
                return ResponseEntity.status(409).build();
            }
            Dentist saved = dentistService.save(dentist);
            DentistResponseDTO dto = dentistService.findByIdAsDTO(saved.getId());
            return ResponseEntity.status(201).body(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno"));
        }
    }

    // Endpoint que nos permite actualizar un dentista
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN') or #dentist.email == authentication.name")
    public ResponseEntity<String> update(@RequestBody Dentist dentist) {
        if (dentist == null || dentist.getId() == null) {
            return ResponseEntity.badRequest().body("El ID del odontólogo es requerido para la actualización");
        }
        Optional<Dentist> dentistOptional = dentistService.findById(dentist.getId());
        if (dentistOptional.isPresent()) {
            dentistService.update(dentist);
            return ResponseEntity.ok("Dentista actualizado correctamente");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            dentistService.delete(id);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno"));
        }
    }

    // Endpoint que nos permite buscar un dentista por ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DentistResponseDTO> findById(@PathVariable Long id) {
        DentistResponseDTO dto = dentistService.findByIdAsDTO(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    // Endpoint que nos permite devolver todos los dentistas
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public List<DentistResponseDTO> findAll() {
        return dentistService.findAllAsDTO();
    }

    // Endpoint que nos permite buscar un dentista por matrícula
    @GetMapping("/registration/{registrationNumber}")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<DentistResponseDTO> findByRegistrationNumber(@PathVariable Integer registrationNumber) {
        return dentistService.findByRegistrationNumber(registrationNumber).map(d -> ResponseEntity.ok(dentistService.findByIdAsDTO(d.getId()))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = dentistService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/check-registration")
    public ResponseEntity<Boolean> checkRegistrationExists(@RequestParam Integer registrationNumber) {
        boolean exists = dentistService.existsByRegistrationNumber(registrationNumber);
        return ResponseEntity.ok(exists);
    }
}
