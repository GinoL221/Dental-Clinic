package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DentistRequestDTO;
import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.security.AuthorizationUtils;
import com.dh.dentalClinicMVC.service.IDentistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dentists")
@Tag(name = "Odontólogos", description = "Alta, consulta y actualización de odontólogos")
public class DentistController {

  private static final Logger log = LoggerFactory.getLogger(DentistController.class);

  private final IDentistService dentistService;

  public DentistController(IDentistService dentistService) {
    this.dentistService = dentistService;
  }

  // Endpoint que nos permite agregar un dentista
  @Operation(summary = "Registra un nuevo odontólogo")
  @ApiResponse(
      responseCode = "409",
      description = "Email o matrícula ya registrados",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DentistResponseDTO> save(@Valid @RequestBody DentistRequestDTO requestDTO) {
    DentistResponseDTO saved = dentistService.save(requestDTO);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  // Endpoint que nos permite actualizar un dentista (full-replace: PUT /dentists/{id})
  @Operation(summary = "Actualiza un odontólogo (ADMIN o el propio odontólogo)")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "Email o matrícula duplicados",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<DentistResponseDTO> update(
      @PathVariable Long id, @Valid @RequestBody DentistRequestDTO requestDTO, Authentication auth)
      throws ResourceNotFoundException {
    boolean isAdmin = AuthorizationUtils.hasRole(auth, "ROLE_ADMIN");

    if (!isAdmin) {
      DentistResponseDTO own =
          dentistService
              .findByEmailAsDTO(auth.getName())
              .orElseThrow(
                  () -> {
                    log.warn(
                        "Stale principal: no dentist record found for authenticated principal {}",
                        auth.getName());
                    return new StalePrincipalException();
                  });
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: dentist {} tried to update record of dentist {}", own.getId(), id);
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
      requestDTO.setEmail(null); // email not self-changeable here
      requestDTO.setRegistrationNumber(
          null); // avoid confusing unique-constraint collision on self-update
    }

    DentistResponseDTO updated = dentistService.update(id, requestDTO);
    return ResponseEntity.ok(updated);
  }

  // Endpoint que nos permite eliminar
  @Operation(summary = "Elimina un odontólogo por ID")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException {
    dentistService.delete(id);
    return ResponseEntity.noContent().build();
  }

  // Endpoint que nos permite buscar un dentista por ID
  @Operation(summary = "Obtiene un odontólogo por ID (un odontólogo solo puede verse a sí mismo)")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<DentistResponseDTO> findById(@PathVariable Long id, Authentication auth)
      throws ResourceNotFoundException {
    boolean isAdmin = AuthorizationUtils.hasRole(auth, "ROLE_ADMIN");
    if (auth != null && !isAdmin) {
      DentistResponseDTO own =
          dentistService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: dentist {} requested record of dentist {}", own.getId(), id);
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
    }
    DentistResponseDTO dto = dentistService.findByIdAsDTO(id);
    if (dto == null) {
      throw new ResourceNotFoundException("Odontólogo no encontrado con ID: " + id);
    }
    return ResponseEntity.ok(dto);
  }

  // Endpoint que nos permite devolver todos los dentistas
  @Operation(summary = "Lista todos los odontólogos")
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public List<DentistResponseDTO> findAll() {
    return dentistService.findAllAsDTO();
  }

  // Endpoint que nos permite buscar un dentista por matrícula
  @Operation(summary = "Obtiene un odontólogo por matrícula")
  @ApiResponse(
      responseCode = "404",
      description = "Odontólogo no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @GetMapping("/registration/{registrationNumber}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<DentistResponseDTO> findByRegistrationNumber(
      @PathVariable Integer registrationNumber) throws ResourceNotFoundException {
    return dentistService
        .findByRegistrationNumberAsDTO(registrationNumber)
        .map(ResponseEntity::ok)
        .orElseThrow(
            () ->
                new ResourceNotFoundException(
                    "Odontólogo no encontrado con matrícula: " + registrationNumber));
  }

  @Operation(summary = "Verifica si un email de odontólogo ya está registrado")
  @GetMapping("/check-email")
  public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
    boolean exists = dentistService.existsByEmail(email);
    return ResponseEntity.ok(exists);
  }

  @Operation(summary = "Verifica si una matrícula ya está registrada")
  @GetMapping("/check-registration")
  public ResponseEntity<Boolean> checkRegistrationExists(@RequestParam Integer registrationNumber) {
    boolean exists = dentistService.existsByRegistrationNumber(registrationNumber);
    return ResponseEntity.ok(exists);
  }
}
