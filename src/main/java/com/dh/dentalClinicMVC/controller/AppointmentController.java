package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
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
    public ResponseEntity<AppointmentDTO> update(@RequestBody AppointmentDTO appointmentDTO) throws Exception {
        ResponseEntity<AppointmentDTO> response;

        // Chequea si el dentista y el paciente existen
        if (iDentistService.findById(appointmentDTO.getDentist_id()).isPresent()
                && iPatientService.findById(appointmentDTO.getPatient_id()).isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el turno como cuerpo
            response = ResponseEntity.ok(iAppointmentService.update(appointmentDTO));
        } else {
            // Seteamos al ResponseEntity con el código 400 BAD_REQUEST
            response = ResponseEntity.badRequest().build();
        }
        return response;
    }

    // Este endpoint elimina un turno
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        ResponseEntity<String> response;

        // Chequea si el turno existe
        if (iAppointmentService.findById(id).isPresent()) {
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
    public ResponseEntity<List<AppointmentDTO>> findAll() {
        return ResponseEntity.ok(iAppointmentService.findAll());
    }
}
