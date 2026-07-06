package com.dh.dentalClinicMVC.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class DentistControllerNegativeTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  // Full editable-field-set body matching DentistRequestDTO.
  private Map<String, Object> validDentistBody() {
    Map<String, Object> body = new HashMap<>();
    body.put("registrationNumber", 4000);
    body.put("firstName", "Ana");
    body.put("lastName", "Bo");
    body.put("email", "dentist-negative@example.com");
    return body;
  }

  @Test
  @Order(1)
  public void whenPostDuplicateEmail_thenConflict409() throws Exception {
    Map<String, Object> dentist1 = validDentistBody();
    dentist1.put("registrationNumber", 2000);
    dentist1.put("email", "dup@example.com");
    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dentist1)))
        .andExpect(status().isCreated());

    Map<String, Object> dentist2 = validDentistBody();
    dentist2.put("registrationNumber", 2001);
    dentist2.put("email", "dup@example.com");
    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dentist2)))
        .andExpect(status().isConflict());
  }

  // Note: the exact validation-error message format changed with Bean
  // Validation (`field: message`, see GlobalExceptionHandler); only the
  // status code is asserted here, matching PatientControllerTest's
  // validation-rejection convention.
  @Test
  @Order(2)
  public void whenPostMissingFirstName_thenBadRequest400() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.remove("firstName");

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostBlankLastName_thenBadRequest400() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.put("lastName", "");

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostMalformedEmail_thenBadRequest400() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.put("email", "not-an-email");

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostNegativeRegistrationNumber_thenBadRequest400() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.put("registrationNumber", -5);

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }

  @Test
  public void whenPostMissingRegistrationNumber_thenBadRequest400() throws Exception {
    Map<String, Object> body = validDentistBody();
    body.remove("registrationNumber");

    mockMvc
        .perform(
            post("/dentists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
  }
}
