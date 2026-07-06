package com.dh.dentalClinicMVC.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.repository.ISpecialtyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SpecialtyControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ISpecialtyRepository specialtyRepository;

  @Autowired private ObjectMapper objectMapper;

  private Specialty savedSpecialty;

  @BeforeEach
  void setUp() {
    if (savedSpecialty == null) {
      Specialty specialty = new Specialty();
      specialty.setName("Odontología General");
      specialty.setDescription("Tratamientos dentales básicos");
      savedSpecialty = specialtyRepository.save(specialty);
    }
  }

  @AfterEach
  void cleanUp() {
    specialtyRepository.deleteAll();
    savedSpecialty = null;
  }

  @Test
  @Order(1)
  void testGetAllSpecialties() throws Exception {
    mockMvc
        .perform(get("/specialties"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @Order(2)
  void testGetSpecialtyById() throws Exception {
    mockMvc
        .perform(get("/specialties/{id}", savedSpecialty.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Odontología General"))
        .andExpect(jsonPath("$.description").value("Tratamientos dentales básicos"));
  }

  @Test
  @Order(3)
  void testGetSpecialtyById_NotFound() throws Exception {
    mockMvc.perform(get("/specialties/{id}", 9999)).andExpect(status().isNotFound());
  }

  @Test
  @Order(4)
  void testCreateSpecialty() throws Exception {
    String json = "{\"name\":\"Ortodoncia\",\"description\":\"Corrección de dientes\"}";

    mockMvc
        .perform(post("/specialties").contentType(MediaType.APPLICATION_JSON).content(json))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Ortodoncia"))
        .andExpect(jsonPath("$.description").value("Corrección de dientes"));
  }

  @Test
  @Order(5)
  void testCreateSpecialty_DuplicateName() throws Exception {
    String json = "{\"name\":\"Odontología General\",\"description\":\"Duplicado\"}";

    mockMvc
        .perform(post("/specialties").contentType(MediaType.APPLICATION_JSON).content(json))
        .andExpect(status().isConflict());
  }

  @Test
  @Order(6)
  void testUpdateSpecialty() throws Exception {
    String json =
        "{\"name\":\"Odontología General Actualizada\",\"description\":\"Descripción actualizada\"}";

    mockMvc
        .perform(
            put("/specialties/{id}", savedSpecialty.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Odontología General Actualizada"))
        .andExpect(jsonPath("$.description").value("Descripción actualizada"));
  }

  @Test
  @Order(7)
  void testUpdateSpecialty_DuplicateName() throws Exception {
    Specialty other = new Specialty();
    other.setName("Otra Especialidad");
    other.setDescription("Descripción");
    specialtyRepository.save(other);

    String json = "{\"name\":\"Otra Especialidad\",\"description\":\"Duplicado\"}";

    mockMvc
        .perform(
            put("/specialties/{id}", savedSpecialty.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
        .andExpect(status().isConflict());
  }

  @Test
  @Order(8)
  void testDeleteSpecialty() throws Exception {
    mockMvc
        .perform(delete("/specialties/{id}", savedSpecialty.getId()))
        .andExpect(status().isNoContent());
  }

  @Test
  @Order(9)
  void testDeleteSpecialty_NotFound() throws Exception {
    mockMvc.perform(delete("/specialties/{id}", 9999)).andExpect(status().isNotFound());
  }
}
