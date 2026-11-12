package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.security.AuthorizationUtils;
import com.dh.dentalClinicMVC.service.IPatientService;
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
@RequestMapping("/patients")
public class PatientController {

  private static final Logger log = LoggerFactory.getLogger(PatientController.class);

  private final IPatientService patientService;

  public PatientController(IPatientService patientService) {
    this.patientService = patientService;
  }

  // Endpoint que nos permite agregar un paciente
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<PatientResponseDTO> save(@Valid @RequestBody PatientRequestDTO requestDTO) {
    PatientResponseDTO saved = patientService.save(requestDTO);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  // Endpoint que nos permite actualizar un paciente (full-replace: PUT /patients/{id})
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','PATIENT')")
  public ResponseEntity<PatientResponseDTO> update(
      @PathVariable Long id, @Valid @RequestBody PatientRequestDTO requestDTO, Authentication auth)
      throws ResourceNotFoundException {
    boolean isAdmin = AuthorizationUtils.hasRole(auth, "ROLE_ADMIN");

    if (!isAdmin) {
      PatientResponseDTO own =
          patientService
              .findByEmailAsDTO(auth.getName())
              .orElseThrow(
                  () -> {
                    log.warn(
                        "Stale principal: no patient record found for authenticated principal {}",
                        auth.getName());
                    return new StalePrincipalException();
                  });
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: patient {} tried to update record of patient {}", own.getId(), id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      requestDTO.setEmail(null); // email not self-changeable here
      requestDTO.setCardIdentity(
          null); // avoid confusing unique-constraint collision on self-update
    }

    PatientResponseDTO updated = patientService.update(id, requestDTO);
    return ResponseEntity.ok(updated);
  }

  // Endpoint que nos permite eliminar
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException {
    patientService.delete(id);
    return ResponseEntity.noContent().build();
  }

  // Endpoint que nos permite buscar un paciente por ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<PatientResponseDTO> findById(@PathVariable Long id, Authentication auth) {
    boolean privileged = AuthorizationUtils.hasAnyRole(auth, "ROLE_ADMIN", "ROLE_DENTIST");
    if (auth != null && !privileged) {
      PatientResponseDTO own =
          patientService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: patient {} requested record of patient {}", own.getId(), id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
    }
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
