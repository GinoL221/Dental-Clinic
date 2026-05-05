package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.ISpecialtyService;
import jakarta.validation.Valid;
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

    // GET /specialties — authenticated users
    @GetMapping("/specialties")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<List<Specialty>> findAll() {
        return ResponseEntity.ok(specialtyService.findAll());
    }

    // POST /specialties — ADMIN only
    @PostMapping("/specialties")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Specialty> save(@Valid @RequestBody Specialty specialty) {
        Specialty saved = specialtyService.save(specialty);
        return ResponseEntity.status(201).body(saved);
    }

    // PUT /specialties/{id} — ADMIN only
    @PutMapping("/specialties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Specialty> update(@PathVariable Long id, @RequestBody Specialty specialty) throws ResourceNotFoundException {
        specialty.setId(id);
        Specialty updated = specialtyService.update(specialty);
        return ResponseEntity.ok(updated);
    }

    // DELETE /specialties/{id} — ADMIN only
    @DeleteMapping("/specialties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException {
        specialtyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // POST /dentists/{id}/specialties/{specialtyId} — ADMIN only (assign)
    @PostMapping("/dentists/{id}/specialties/{specialtyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignSpecialty(@PathVariable Long id, @PathVariable Long specialtyId) throws ResourceNotFoundException {
        specialtyService.assignToDentist(id, specialtyId);
        return ResponseEntity.ok().build();
    }

    // DELETE /dentists/{id}/specialties/{specialtyId} — ADMIN only (remove)
    @DeleteMapping("/dentists/{id}/specialties/{specialtyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeSpecialty(@PathVariable Long id, @PathVariable Long specialtyId) throws ResourceNotFoundException {
        specialtyService.removeFromDentist(id, specialtyId);
        return ResponseEntity.noContent().build();
    }
}
