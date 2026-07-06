package com.dh.dentalClinicMVC.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
class PatientControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @Order(1)
  public void testGetAllPatients() throws Exception {
    mockMvc.perform(get("/patients").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk());
  }

  // Full editable-field-set body matching PatientRequestDTO.
  private Map<String, Object> validPatientBody() {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", "Carlos");
    body.put("lastName", "Rivas");
    body.put("email", "carlos.rivas@example.com");
    body.put("cardIdentity", 90001);
    body.put("admissionDate", LocalDate.now().toString());
    return body;
  }

  @Test
  public void whenPostValidPatient_thenCreated() throws Exception {
    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validPatientBody())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.firstName").value("Carlos"))
        .andExpect(jsonPath("$.lastName").value("Rivas"));
  }

  // Note: PUT /patients/{id} update-success paths are covered in
  // PatientControllerAuthzTest, which runs the full security filter
  // chain. The `update` controller method takes an `Authentication`
  // parameter resolved from the servlet principal, which is null under
  // this class's `addFilters = false` MockMvc setup — see the rationale
  // documented on PatientControllerAuthzTest.

  @Test
  public void whenPostBlankFirstName_thenBadRequest() throws Exception {
    Map<String, Object> body = validPatientBody();
    body.put("firstName", "");

    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostMissingLastName_thenBadRequest() throws Exception {
    Map<String, Object> body = validPatientBody();
    body.remove("lastName");

    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostMalformedEmail_thenBadRequest() throws Exception {
    Map<String, Object> body = validPatientBody();
    body.put("email", "not-an-email");

    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostNegativeCardIdentity_thenBadRequest() throws Exception {
    Map<String, Object> body = validPatientBody();
    body.put("cardIdentity", -5);

    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostAddressWithBlankLocation_thenBadRequest() throws Exception {
    Map<String, Object> body = validPatientBody();
    Map<String, Object> address = new HashMap<>();
    address.put("street", "Main St");
    address.put("number", 123);
    address.put("location", "");
    address.put("province", "Buenos Aires");
    body.put("address", address);

    mockMvc
        .perform(
            post("/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }
}
