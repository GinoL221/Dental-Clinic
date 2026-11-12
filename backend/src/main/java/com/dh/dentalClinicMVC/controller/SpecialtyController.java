package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.ISpecialtyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/specialties")
@Tag(
    name = "Especialidades",
    description = "Gestión de especialidades y su asignación a odontólogos")
public class SpecialtyController {

  private final ISpecialtyService specialtyService;

  public SpecialtyController(ISpecialtyService specialtyService) {
    this.specialtyService = specialtyService;
  }

  @Operation(summary = "Lista todas las especialidades")
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<List<SpecialtyDTO>> findAll() {
    return ResponseEntity.ok(specialtyService.findAll());
  }

  @Operation(summary = "Obtiene una especialidad por ID")
  @ApiResponse(
      responseCode = "404",
      description = "Especialidad no encontrada",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<SpecialtyDTO> findById(@PathVariable Long id)
      throws ResourceNotFoundException {
    return ResponseEntity.ok(specialtyService.findById(id));
  }

  @Operation(summary = "Crea una nueva especialidad")
  @ApiResponse(
      responseCode = "409",
      description = "Especialidad duplicada",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<SpecialtyDTO> save(@Valid @RequestBody SpecialtyDTO specialty)
      throws DuplicateResourceException {
    SpecialtyDTO saved = specialtyService.save(specialty);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  @Operation(summary = "Actualiza una especialidad")
  @ApiResponse(
      responseCode = "404",
      description = "Especialidad no encontrada",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "Nombre de especialidad duplicado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<SpecialtyDTO> update(
      @PathVariable Long id, @Valid @RequestBody SpecialtyDTO specialty)
      throws ResourceNotFoundException {
    SpecialtyDTO updated = specialtyService.update(id, specialty);
    return ResponseEntity.ok(updated);
  }

  @Operation(summary = "Elimina una especialidad")
  @ApiResponse(
      responseCode = "404",
      description = "Especialidad no encontrada",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "La especialidad está asignada a odontólogos",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id)
      throws ResourceNotFoundException, DuplicateResourceException {
    specialtyService.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Asigna una especialidad a un odontólogo")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo o especialidad no encontrados",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "La especialidad ya está asignada al odontólogo",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PostMapping("/dentists/{dentistId}/specialties/{specialtyId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> assignSpecialty(
      @PathVariable Long dentistId, @PathVariable Long specialtyId)
      throws ResourceNotFoundException, DuplicateResourceException {
    specialtyService.assignSpecialtyToDentist(dentistId, specialtyId);
    return ResponseEntity.ok().build();
  }

  @Operation(summary = "Quita una especialidad de un odontólogo")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo o especialidad no encontrados",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @DeleteMapping("/dentists/{dentistId}/specialties/{specialtyId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> removeSpecialty(
      @PathVariable Long dentistId, @PathVariable Long specialtyId)
      throws ResourceNotFoundException {
    specialtyService.removeSpecialtyFromDentist(dentistId, specialtyId);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Lista las especialidades de un odontólogo")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @GetMapping("/dentists/{dentistId}/specialties")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<List<SpecialtyDTO>> findByDentistId(@PathVariable Long dentistId)
      throws ResourceNotFoundException {
    return ResponseEntity.ok(specialtyService.findByDentistId(dentistId));
  }
}
