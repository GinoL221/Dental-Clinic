package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientRequestMapper;
import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.IPatientService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patients")
public class PatientController {

  private static final Logger log = LoggerFactory.getLogger(PatientController.class);

  private final IPatientService patientService;

  @Autowired
  public PatientController(IPatientService patientService) {
    this.patientService = patientService;
  }

  // Endpoint que nos permite agregar un paciente
  @PostMapping
  public ResponseEntity<PatientResponseDTO> save(@Valid @RequestBody PatientRequestDTO requestDTO) {
    if (requestDTO.getEmail() != null && patientService.existsByEmail(requestDTO.getEmail())) {
      return ResponseEntity.status(409).build();
    }
    if (requestDTO.getCardIdentity() != null
        && patientService.existsByCardIdentity(requestDTO.getCardIdentity())) {
      return ResponseEntity.status(409).build();
    }
    Patient patient = PatientRequestMapper.toEntity(requestDTO);
    Patient saved = patientService.save(patient);
    PatientResponseDTO dto = patientService.findByIdAsDTO(saved.getId());
    return ResponseEntity.status(201).body(dto);
  }

  // Endpoint que nos permite actualizar un paciente (full-replace: PUT /patients/{id})
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','PATIENT')")
  public ResponseEntity<String> update(
      @PathVariable Long id,
      @Valid @RequestBody PatientRequestDTO requestDTO,
      Authentication auth) {
    boolean isAdmin =
        auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    Patient patient = PatientRequestMapper.toEntity(requestDTO);
    patient.setId(id);

    if (!isAdmin) {
      Patient own =
          patientService
              .findByEmail(auth.getName())
              .orElseThrow(
                  () -> {
                    log.warn(
                        "Authz denial: no patient record found for authenticated principal {}",
                        auth.getName());
                    return new AccessDeniedException("No autorizado");
                  });
      if (!own.getId().equals(id)) {
        log.warn("IDOR attempt: patient {} tried to update record of patient {}", own.getId(), id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      patient.setEmail(null); // email not self-changeable here
    }

    Optional<Patient> patientOptional = patientService.findById(id);
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
    patientService.delete(id);
    return ResponseEntity.ok("Se eliminó el paciente con id: " + id);
  }

  // Endpoint que nos permite buscar un paciente por ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<PatientResponseDTO> findById(@PathVariable Long id, Authentication auth) {
    boolean privileged =
        auth.getAuthorities().stream()
            .anyMatch(
                a ->
                    a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_DENTIST"));
    if (!privileged) {
      Patient own =
          patientService
              .findByEmail(auth.getName())
              .orElseThrow(() -> new AccessDeniedException("No autorizado"));
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
