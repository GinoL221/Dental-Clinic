package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.model.Dentist;
import com.dh.dentalClinicMVC.services.DentistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;
import com.dh.dentalClinicMVC.model.Patient;
import com.dh.dentalClinicMVC.services.PatientService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/start")
public class StartController {

    private PatientService patientService;
    private DentistService dentistService;

    @Autowired
    public StartController(PatientService patientService, DentistService dentistService) {
        this.patientService = patientService;
        this.dentistService = dentistService;
    }

    // Este metodo maneja las solicitudes GET a la ruta "/patient"
    @GetMapping
    public String findPatientByEmail(Model model, @RequestParam("email") String email,
                                     @RequestParam("id") Integer id) {

        // Llama al servicio de paciente
        Patient patient = patientService.findByEmail(email);
        // Llama al servicio de odontólogo
        Dentist dentist = dentistService.findById(id);

        model.addAttribute("name", patient.getName());
        model.addAttribute("lastName", patient.getLastName());

        // Agregar la vista que se corresponde con Odontólogo
        model.addAttribute("dentistName", dentist.getName());
        model.addAttribute("dentistLastName", dentist.getLastName());
        model.addAttribute("registrationNumber", dentist.getRegistrationNumber());

        return "start";
    }
}
