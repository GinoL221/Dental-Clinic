package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DentistRequestDTO;
import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.security.AuthorizationUtils;
import com.dh.dentalClinicMVC.service.IDentistService;
import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dentists")
public class DentistController {

  private static final Logger log = LoggerFactory.getLogger(DentistController.class);

  private final IDentistService dentistService;

  public DentistController(IDentistService dentistService) {
    this.dentistService = dentistService;
  }

  // Endpoint que nos permite agregar un dentista
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DentistResponseDTO> save(@Valid @RequestBody DentistRequestDTO requestDTO) {
    DentistResponseDTO saved = dentistService.save(requestDTO);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  // Endpoint que nos permite actualizar un dentista (full-replace: PUT /dentists/{id})
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<DentistResponseDTO> update(
      @PathVariable Long id, @Valid @RequestBody DentistRequestDTO requestDTO, Authentication auth)
      throws ResourceNotFoundException {
    boolean isAdmin = AuthorizationUtils.hasRole(auth, "ROLE_ADMIN");

    if (!isAdmin) {
      Dentist own =
          dentistService
              .findByEmail(auth.getName())
              .orElseThrow(
                  () -> {
                    log.warn(
                        "Stale principal: no dentist record found for authenticated principal {}",
                        auth.getName());
                    return new StalePrincipalException();
                  });
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: dentist {} tried to update record of dentist {}", own.getId(), id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      requestDTO.setEmail(null); // email not self-changeable here
      requestDTO.setRegistrationNumber(
          null); // avoid confusing unique-constraint collision on self-update
    }

    DentistResponseDTO updated = dentistService.update(id, requestDTO);
    return ResponseEntity.ok(updated);
  }

  // Endpoint que nos permite eliminar
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException {
    dentistService.delete(id);
    return ResponseEntity.noContent().build();
  }

  // Endpoint que nos permite buscar un dentista por ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<DentistResponseDTO> findById(@PathVariable Long id, Authentication auth) {
    boolean isAdmin = AuthorizationUtils.hasRole(auth, "ROLE_ADMIN");
    if (auth != null && !isAdmin) {
      Dentist own =
          dentistService.findByEmail(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: dentist {} requested record of dentist {}", own.getId(), id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
    }
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
  public ResponseEntity<DentistResponseDTO> findByRegistrationNumber(
      @PathVariable Integer registrationNumber) {
    return dentistService
        .findByRegistrationNumber(registrationNumber)
        .map(d -> ResponseEntity.ok(dentistService.findByIdAsDTO(d.getId())))
        .orElseGet(() -> ResponseEntity.notFound().build());
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
