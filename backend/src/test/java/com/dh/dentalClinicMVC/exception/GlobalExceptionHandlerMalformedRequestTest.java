package com.dh.dentalClinicMVC.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GlobalExceptionHandlerMalformedRequestTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("Malformed JSON payload in request body must return 400 Bad Request, not 500")
  void whenMalformedJsonPayload_thenReturn400BadRequest() throws Exception {
    String brokenJson = "{\"email\": \"test@email.com\", \"password\": ";

    mockMvc
        .perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(brokenJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.error").value("Cuerpo de solicitud inválido"))
        .andExpect(
            jsonPath("$.message").value("El formato del JSON es inválido o no se pudo procesar"));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  @DisplayName(
      "Path variable type mismatch (e.g. string for Long ID) must return 400 Bad Request, not 500")
  void whenPathVariableTypeMismatch_thenReturn400BadRequest() throws Exception {
    mockMvc
        .perform(get("/patients/invalid-id-format").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.error").value("Tipo de parámetro inválido"))
        .andExpect(
            jsonPath("$.message").value("El parámetro 'id' debe ser de tipo numérico (Long)"));
  }
}
