package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
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
    public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
        iAppointmentService.delete(id);
        return ResponseEntity.ok("Se elimino el turno con id: " + id);
    }

    // Este endpoint consulta todos los turnos
    @GetMapping
    public ResponseEntity<List<AppointmentDTO>> findAll() {
        return ResponseEntity.ok(iAppointmentService.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AppointmentDTO>> searchAppointments(
            @RequestParam(required = false) String patient,
            @RequestParam(required = false) String dentist,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(iAppointmentService.searchAppointments(patient, dentist, status, fromDate, toDate, pageable));
    }
}
