package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.model.Dentist;
import com.dh.dentalClinicMVC.services.DentistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dentists")
public class DentistController {

    private DentistService dentistService;

    @Autowired
    public DentistController(DentistService dentistService) {
        this.dentistService = dentistService;
    }

    // Endpoint que nos permite agregar un dentista
    @PostMapping
    public Dentist save(@RequestBody Dentist dentist) {
        return dentistService.save(dentist);
    }

    // Endpoint que nos permite actualizar un dentista
    @PutMapping
    public void update(@RequestBody Dentist dentist) {
        dentistService.update(dentist);
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        dentistService.delete(id);
    }

    // Endpoint que nos permite buscar un dentista por ID
    @GetMapping("/{id}")
    public Dentist findById(@PathVariable Integer id) {
        return dentistService.findById(id);
    }

    // Endpoint que nos permite devolver todos los dentistas
    @GetMapping
    public List<Dentist> findAll() {
        return dentistService.findAll();
    }
}
