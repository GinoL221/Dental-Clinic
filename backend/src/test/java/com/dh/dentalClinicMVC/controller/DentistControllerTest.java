package com.dh.dentalClinicMVC.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
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
class DentistControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private IDentistService iDentistService;

  @Autowired private ObjectMapper objectMapper;

  // Carga un dentista de prueba en la base de datos y retorna la entidad guardada.
  public Dentist dataLoad() {
    Dentist dentist = new Dentist();
    dentist.setRegistrationNumber(5826);
    dentist.setFirstName("Pedro");
    dentist.setLastName("Muelas");
    dentist.setEmail("pedro.muelas@example.com");
    return iDentistService.save(dentist);
  }

  // Prueba el endpoint GET /dentists/{id} para obtener un dentista por su ID.
  // Verifica que los datos del dentista sean los esperados.
  @Test
  @Order(2)
  public void testGetDentistById() throws Exception {
    Dentist saved = dataLoad(); // Carga datos de prueba y obtiene la entidad con id
    mockMvc
        .perform(
            get("/dentists/" + saved.getId()) // Realiza una solicitud GET al endpoint
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk()) // Verifica que la respuesta sea 200 OK
        .andExpect(jsonPath("$.registrationNumber").value(5826)) // Verifica el número de registro
        .andExpect(jsonPath("$.firstName").value("Pedro")) // Verifica el nombre
        .andExpect(jsonPath("$.lastName").value("Muelas")); // Verifica el apellido
  }

  // Full editable-field-set body matching DentistRequestDTO (D1: full-replace contract).
  private Map<String, Object> validDentistBody() {
    Map<String, Object> body = new HashMap<>();
    body.put("registrationNumber", 1234);
    body.put("firstName", "Juan");
    body.put("lastName", "Pérez");
    body.put("email", "juan.perez@example.com");
    return body;
  }

  // Prueba el endpoint POST /dentists para crear un nuevo dentista.
  // Verifica que los datos del dentista creado sean correctos.
  @Test
  @Order(3)
  public void testPostDentist() throws Exception {
    mockMvc
        .perform(
            post("/dentists") // Realiza una solicitud POST al endpoint
                .contentType(MediaType.APPLICATION_JSON) // Especifica el tipo de contenido
                .content(
                    objectMapper.writeValueAsString(
                        validDentistBody())) // Envía el cuerpo de la solicitud
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isCreated()) // Verifica que la respuesta sea 201 Created
        .andExpect(jsonPath("$.registrationNumber").value(1234)) // Verifica el número de registro
        .andExpect(jsonPath("$.firstName").value("Juan")) // Verifica el nombre
        .andExpect(jsonPath("$.lastName").value("Pérez")); // Verifica el apellido
  }

  // Prueba el endpoint GET /dentists para obtener todos los dentistas.
  // Verifica que inicialmente la lista esté vacía.
  @Test
  @Order(1)
  public void testGetAllDentist() throws Exception {
    mockMvc
        .perform(get("/dentists")) // Realiza una solicitud GET al endpoint
        .andDo(print()) // Imprime la respuesta en la consola
        .andExpect(status().isOk()) // Verifica que la respuesta sea 200 OK
        .andExpect(content().string("[]")); // Verifica que la lista esté vacía
  }

  // DentistRequestDTO structurally excludes `role` (D7): an injected `role`
  // in the create body has no effect — the service always defaults new
  // dentists to Role.DENTIST regardless of what an admin submits here.
  @Test
  public void whenPostDentistWithRoleInBody_thenRoleIsIgnoredDefaultsToDentist() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.put("registrationNumber", 9999);
    body.put("email", "role-ignored@example.com");
    body.put("role", "ADMIN");

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated());

    Dentist saved = iDentistService.findByRegistrationNumber(9999).orElseThrow();
    assertEquals(Role.DENTIST, saved.getRole());
  }
}
