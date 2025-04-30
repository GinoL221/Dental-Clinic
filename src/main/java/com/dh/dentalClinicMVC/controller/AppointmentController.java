package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.services.IAppointmentService;
import com.dh.dentalClinicMVC.services.impl.IDentistService;
import com.dh.dentalClinicMVC.services.impl.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok(iAppointmentService.save(appointmentDTO));
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return response;
    }

    // Este endpoint elimina un turno
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> findById(@PathVariable Long id) {
        Optional<Appointment> appointmentToLookFor = iAppointmentService.findById(id);

        // Chequea si el turno existe
        if (appointmentToLookFor.isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            return ResponseEntity.ok(appointmentToLookFor.get());
        } else {
            // Seteamos al ResponseEntity con el código 404 NOT_FOUND
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // Este endpoint elimina un turno
    @PutMapping
    public ResponseEntity<String> update(@RequestBody Appointment appointment) {
        ResponseEntity<String> response;

        // Chequea si el dentista y el paciente existen
        if (iDentistService.findById(appointment.getDentist().getId()).isPresent()
                && iPatientService.findById(appointment.getPatient().getId()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok("Turno con id:" + appointment.getId() + "actualizado correctamente");
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.badRequest().body("El turno no se puede actualizar porque no existe" +
                    " en la base de datos un turno con id:" + appointment.getId());
        }
        return response;
    }

    // Este endpoint elimina un turno
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        ResponseEntity<String> response;
        Optional<Appointment> appointmentToLookFor = iAppointmentService.findById(id);

        // Chequea si el turno existe
        if (appointmentToLookFor.isPresent()) {
            iAppointmentService.delete(id);
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok("Turno eliminado correctamente");
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.badRequest().body("El turno no se puede eliminar porque no existe" +
                    " en la base de datos un turno con id:" + id);
        }
        return response;
    }

    // Este endpoint consulta todos los turnos
    @GetMapping
    public ResponseEntity<List<Appointment>> findAll() {
        return ResponseEntity.ok(iAppointmentService.findAll());
    }
}
