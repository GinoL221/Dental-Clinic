package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final IAppointmentService appointmentService;
    private final IDentistService dentistService;
    private final IPatientService patientService;

    @Autowired
    public AppointmentController(IAppointmentService appointmentService, IDentistService dentistService,
            IPatientService patientService) {
        this.appointmentService = appointmentService;
        this.dentistService = dentistService;
        this.patientService = patientService;
    }

    // Este endpoint guarda un turno
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<AppointmentDTO> save(@RequestBody AppointmentDTO appointmentDTO) {
        ResponseEntity<AppointmentDTO> response;

        // Chequea si el dentista y el paciente existen
        if (dentistService.findById(appointmentDTO.getDentist_id()).isPresent()
                && patientService.findById(appointmentDTO.getPatient_id()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok(appointmentService.save(appointmentDTO));
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return response;
    }

    // Este endpoint elimina un turno
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<AppointmentDTO> findById(@PathVariable Long id) {
        Optional<AppointmentDTO> appointmentToLookFor = appointmentService.findById(id);

        // Chequea si el turno existe
        if (appointmentToLookFor.isPresent()) {
            return ResponseEntity.ok(appointmentToLookFor.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // Este endpoint actualiza un turno
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<AppointmentDTO> update(@RequestBody AppointmentDTO appointmentDTO)
            throws ResourceNotFoundException {
        ResponseEntity<AppointmentDTO> response;

        // Chequea si el dentista y el paciente existen
        if (dentistService.findById(appointmentDTO.getDentist_id()).isPresent()
                && patientService.findById(appointmentDTO.getPatient_id()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok(appointmentService.update(appointmentDTO));
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.badRequest().build();
        }
        return response;
    }

    // Este endpoint elimina un turno
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
        appointmentService.delete(id);
        return ResponseEntity.ok("Se elimino el turno con id: " + id);
    }

    // Este endpoint consulta todos los turnos
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<List<AppointmentDTO>> findAll() {
        return ResponseEntity.ok(appointmentService.findAll());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<Page<AppointmentDTO>> searchAppointments(
            @RequestParam(required = false) String patient,
            @RequestParam(required = false) String dentist,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity
                .ok(appointmentService.searchAppointments(patient, dentist, status, fromDate, toDate, pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String s = body.get("status");
            if (s == null)
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            AppointmentStatus status = AppointmentStatus.valueOf(s);
            AppointmentDTO updated = appointmentService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid status"));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno"));
        }
    }
}
