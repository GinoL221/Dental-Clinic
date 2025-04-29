package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.model.Appointment;
import com.dh.dentalClinicMVC.services.AppointmentService;
import com.dh.dentalClinicMVC.services.DentistService;
import com.dh.dentalClinicMVC.services.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private AppointmentService appointmentService;
    private DentistService dentistService;
    private PatientService patientService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService, DentistService dentistService,
                                 PatientService patientService) {
        this.appointmentService = appointmentService;
        this.dentistService = dentistService;
        this.patientService = patientService;
    }

    @PostMapping
    public ResponseEntity<Appointment> save(@RequestBody Appointment appointment) {
        ResponseEntity<Appointment> response;
        // Chequea si el dentista y el paciente existen
        if (dentistService.findById(appointment.getDentist().getId()) != null
                && patientService.findById(appointment.getPatient().getId()) != null) {
            // seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok(appointmentService.save(appointment));
        } else {
            // seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return response;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> findAll() {
        return ResponseEntity.ok(appointmentService.findAll());
    }

}
