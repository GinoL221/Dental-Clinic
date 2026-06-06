package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.ISpecialtyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SpecialtyController {

    private final ISpecialtyService specialtyService;

    public SpecialtyController(ISpecialtyService specialtyService) {
        this.specialtyService = specialtyService;
    }

    @GetMapping("/specialties")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<List<SpecialtyDTO>> findAll() {
        return ResponseEntity.ok(specialtyService.findAll());
    }

    @GetMapping("/specialties/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<SpecialtyDTO> findById(@PathVariable Long id) throws ResourceNotFoundException {
        return ResponseEntity.ok(specialtyService.findById(id));
    }

    @PostMapping("/specialties")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDTO> save(@Valid @RequestBody Specialty specialty) throws DuplicateResourceException {
        SpecialtyDTO saved = specialtyService.save(specialty);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/specialties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDTO> update(@PathVariable Long id, @Valid @RequestBody Specialty specialty) throws ResourceNotFoundException {
        SpecialtyDTO updated = specialtyService.update(id, specialty);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/specialties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException, DuplicateResourceException {
        specialtyService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/dentists/{dentistId}/specialties/{specialtyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignSpecialty(@PathVariable Long dentistId, @PathVariable Long specialtyId)
            throws ResourceNotFoundException, DuplicateResourceException {
        specialtyService.assignSpecialtyToDentist(dentistId, specialtyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/dentists/{dentistId}/specialties/{specialtyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeSpecialty(@PathVariable Long dentistId, @PathVariable Long specialtyId)
            throws ResourceNotFoundException {
        specialtyService.removeSpecialtyFromDentist(dentistId, specialtyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dentists/{dentistId}/specialties")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<List<SpecialtyDTO>> findByDentistId(@PathVariable Long dentistId) throws ResourceNotFoundException {
        return ResponseEntity.ok(specialtyService.findByDentistId(dentistId));
    }
}
