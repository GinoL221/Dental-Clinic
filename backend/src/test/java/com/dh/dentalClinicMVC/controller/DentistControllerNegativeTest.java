package com.dh.dentalClinicMVC.controller;

import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Rollback;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
class DentistControllerNegativeTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @Order(1)
    public void whenPostDuplicateEmail_thenConflict409() throws Exception {
        // Primer dentista
        String dentist1 = "{\"registrationNumber\":2000,\"firstName\":\"A\",\"lastName\":\"B\",\"email\":\"dup@example.com\"}";
        mockMvc.perform(post("/dentists").contentType(MediaType.APPLICATION_JSON).content(dentist1)).andExpect(status().isCreated());

        // Segundo dentista con mismo email -> 409
        String dentist2 = "{\"registrationNumber\":2001,\"firstName\":\"C\",\"lastName\":\"D\",\"email\":\"dup@example.com\"}";
        mockMvc.perform(post("/dentists").contentType(MediaType.APPLICATION_JSON).content(dentist2)).andExpect(status().isConflict());
    }

    @Test
    @Order(2)
    public void whenPostMissingFirstName_thenBadRequest400() throws Exception {
        String invalid = "{\"registrationNumber\":3000,\"lastName\":\"NoName\",\"email\":\"noname@example.com\"}";
    mockMvc.perform(post("/dentists").contentType(MediaType.APPLICATION_JSON).content(invalid))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("El nombre es requerido"));
    }
}
