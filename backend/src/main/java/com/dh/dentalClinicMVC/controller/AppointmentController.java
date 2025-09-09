package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private IAppointmentService iAppointmentService;
    private IDentistService iDentistService;
    private IPatientService iPatientService;

    @Autowired
    public AppointmentController(IAppointmentService iAppointmentService, IDentistService iDentistService,
            IPatientService iPatientService) {
        this.iAppointmentService = iAppointmentService;
        this.iDentistService = iDentistService;
        this.iPatientService = iPatientService;
    }

    // Este endpoint guarda un turno
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<AppointmentDTO> save(@RequestBody AppointmentDTO appointmentDTO) {
        ResponseEntity<AppointmentDTO> response;

        // Chequea si el dentista y el paciente existen
        if (iDentistService.findById(appointmentDTO.getDentist_id()).isPresent()
                && iPatientService.findById(appointmentDTO.getPatient_id()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como
            // cuerpo
            response = ResponseEntity.ok(iAppointmentService.save(appointmentDTO));
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
        Optional<AppointmentDTO> appointmentToLookFor = iAppointmentService.findById(id);

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
        if (iDentistService.findById(appointmentDTO.getDentist_id()).isPresent()
                && iPatientService.findById(appointmentDTO.getPatient_id()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como
            // cuerpo
            response = ResponseEntity.ok(iAppointmentService.update(appointmentDTO));
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
        iAppointmentService.delete(id);
        return ResponseEntity.ok("Se elimino el turno con id: " + id);
    }

    // Este endpoint consulta todos los turnos
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
    public ResponseEntity<List<AppointmentDTO>> findAll() {
        return ResponseEntity.ok(iAppointmentService.findAll());
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
                .ok(iAppointmentService.searchAppointments(patient, dentist, status, fromDate, toDate, pageable));
    }
}
