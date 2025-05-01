package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.service.impl.DentistServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/dentists")
public class DentistController {

    private DentistServiceImpl iDentistService;

    @Autowired
    public DentistController(DentistServiceImpl iDentistService) {
        this.iDentistService = iDentistService;
    }

    // Endpoint que nos permite agregar un dentista
    @PostMapping
    public ResponseEntity<Dentist> save(@RequestBody Dentist dentist) {
        return ResponseEntity.ok(iDentistService.save(dentist));
    }

    // Endpoint que nos permite actualizar un dentista
    @PutMapping
    public ResponseEntity<String> update(@RequestBody Dentist dentist) {
        ResponseEntity<String> response;
        Optional<Dentist> dentistOptional = iDentistService.findById(dentist.getId());

        if (dentistOptional.isPresent()) {
            iDentistService.update(dentist);
            response = ResponseEntity.ok("Dentista actualizado correctamente");
        } else {
            response = ResponseEntity.badRequest().body("El dentista no se puede actualizar " +
                    "porque no existe en la base de datos");
        }
        return response;
    }

    // Endpoint que nos permite eliminar
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        ResponseEntity<String> response;
        Optional<Dentist> dentist = iDentistService.findById(id);

        if (dentist.isPresent()) {
            iDentistService.delete(id);
            response = ResponseEntity.ok("Dentista eliminado correctamente");
        } else {
            response = ResponseEntity.badRequest().body("El dentista no se puede eliminar " +
                    "porque no existe en la base de datos");
        }
        return response;
    }

    // Endpoint que nos permite buscar un dentista por ID
    @GetMapping("/{id}")
    public ResponseEntity<Dentist> findById(@PathVariable Long id) {
        Optional<Dentist> dentist = iDentistService.findById(id);

        if (dentist.isPresent()) {
            // Seteamos al ResponseEntity con el código 200 OK y le agregamos el dentista como cuerpo
            return ResponseEntity.ok(dentist.get());
        } else {
            // Seteamos al ResponseEntity con el código 404 NOT_FOUND
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoint que nos permite devolver todos los dentistas
    @GetMapping
    public List<Dentist> findAll() {
        return iDentistService.findAll();
    }
}
