package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.service.IDentistService;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DentistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private IDentistService iDentistService;

    // Carga un dentista de prueba en la base de datos.
    public void dataLoad() {
        Dentist dentist = new Dentist();
        dentist.setRegistrationNumber(5826);
        dentist.setName("Pedro");
        dentist.setLastName("Muelas");
        iDentistService.save(dentist);
    }

    // Prueba el endpoint GET /dentists/{id} para obtener un dentista por su ID.
    // Verifica que los datos del dentista sean los esperados.
    @Test
    @Order(2)
    public void testGetDentistById() throws Exception {
        dataLoad();
        mockMvc.perform(get("/dentists/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registrationNumber").value("5826"))
                .andExpect(jsonPath("$.name").value("Pedro"))
                .andExpect(jsonPath("$.lastName").value("Muelas"));
    }

    @Test
    @Order(3)
    public void testPostDentist() throws Exception {
        String dentistSaved = " {\"registrationNumber\": \"1234\",\"name\": \"Juan\",\"lastName\": \"Pérez\"} ";

        mockMvc.perform(post("/dentists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dentistSaved)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registrationNumber").value("1234"))
                .andExpect(jsonPath("$.name").value("Juan"))
                .andExpect(jsonPath("$.lastName").value("Pérez"));
    }

    @Test
    @Order(1)
    public void testGetAllDentist() throws Exception {
        mockMvc.perform(get("/dentists"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("[]"));
    }
}