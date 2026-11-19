package com.dh.dentalClinicMVC.configuration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Smoke test for the OpenAPI contract in the dev/test profile: springdoc must serve the api-docs
 * document and it must describe the real API surface. Production keeps it disabled (see
 * SwaggerProductionSecurityTest).
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiDocsSmokeTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("GET /v3/api-docs must return 200 with the OpenAPI document")
  void whenGetApiDocs_thenOk() throws Exception {
    mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
  }

  @Test
  @DisplayName("The OpenAPI document must describe the real API surface")
  void whenGetApiDocs_thenDescribesControllersAndJwtSecurity() throws Exception {
    MvcResult result = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn();

    String body = result.getResponse().getContentAsString();

    assertThat(body).isNotBlank();

    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> paths = JsonPath.read(body, "$.paths");
    assertThat(paths)
        .containsKeys(
            "/auth/login",
            "/patients",
            "/dentists",
            "/appointments",
            "/specialties",
            "/dashboard/snapshot");

    // One representative operation per controller: GET collections and POST /auth/login.
    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> loginOps =
        (java.util.Map<String, Object>) paths.get("/auth/login");
    assertThat(loginOps).containsKey("post");
    for (String path : new String[] {"/patients", "/dentists", "/appointments", "/specialties"}) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> ops = (java.util.Map<String, Object>) paths.get(path);
      assertThat(ops).containsKey("get");
    }
    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> dashboardOps =
        (java.util.Map<String, Object>) paths.get("/dashboard/snapshot");
    assertThat(dashboardOps).containsKey("get");

    // Security scheme wired by OpenApiConfiguration.
    assertThat((String) JsonPath.read(body, "$.components.securitySchemes.bearerAuth.type"))
        .isEqualTo("http");
    assertThat((String) JsonPath.read(body, "$.components.securitySchemes.bearerAuth.scheme"))
        .isEqualTo("bearer");
  }

  @Test
  @DisplayName("Operations carry tags and the shared ErrorResponse schema is referenced")
  void whenGetApiDocs_thenTagsAndErrorResponseSchemaArePresent() throws Exception {
    MvcResult result = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn();

    String body = result.getResponse().getContentAsString();

    @SuppressWarnings("unchecked")
    java.util.List<String> tags = JsonPath.read(body, "$.paths['/patients'].get.tags");
    assertThat(tags).contains("Pacientes");

    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> schemas = JsonPath.read(body, "$.components.schemas");
    assertThat(schemas).containsKey("ErrorResponse");

    assertThat(body).contains("#/components/schemas/ErrorResponse");
  }

  @Test
  @DisplayName("DELETE operations declare the 409 conflict returned when the record is in use")
  void whenGetApiDocs_thenDeleteOperationsDeclareConflict() throws Exception {
    MvcResult result = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn();

    String body = result.getResponse().getContentAsString();

    for (String path : new String[] {"/patients/{id}", "/dentists/{id}"}) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> responses =
          JsonPath.read(body, "$.paths['" + path + "'].delete.responses");
      assertThat(responses).as("DELETE %s responses", path).containsKeys("404", "409");

      String conflictSchema =
          JsonPath.read(
              body,
              "$.paths['" + path + "'].delete.responses['409'].content['*/*'].schema['$ref']");
      assertThat(conflictSchema)
          .as("DELETE %s 409 schema", path)
          .isEqualTo("#/components/schemas/ErrorResponse");
    }
  }

  @Test
  @DisplayName(
      "Auth operations declare 429 rate-limit and 409 protected-demo ErrorResponse schemas")
  void whenGetApiDocs_thenAuthOperationsDeclareRateLimitAndConflict() throws Exception {
    MvcResult result = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn();

    String body = result.getResponse().getContentAsString();

    for (String[] op :
        new String[][] {
          {"/auth/login", "post"},
          {"/auth/register", "post"},
          {"/auth/check-email", "get"}
        }) {
      String path = op[0];
      String method = op[1];
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> responses =
          JsonPath.read(body, "$.paths['" + path + "']." + method + ".responses");
      assertThat(responses).as("%s %s responses", method.toUpperCase(), path).containsKey("429");

      String rateLimitSchema =
          JsonPath.read(
              body,
              "$.paths['"
                  + path
                  + "']."
                  + method
                  + ".responses['429'].content['*/*'].schema['$ref']");
      assertThat(rateLimitSchema)
          .as("%s %s 429 schema", method.toUpperCase(), path)
          .isEqualTo("#/components/schemas/ErrorResponse");
    }

    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> changePasswordResponses =
        JsonPath.read(body, "$.paths['/auth/change-password'].post.responses");
    assertThat(changePasswordResponses)
        .as("POST /auth/change-password responses")
        .containsKey("409");

    String changePasswordConflictSchema =
        JsonPath.read(
            body,
            "$.paths['/auth/change-password'].post.responses['409'].content['*/*'].schema['$ref']");
    assertThat(changePasswordConflictSchema)
        .as("POST /auth/change-password 409 schema")
        .isEqualTo("#/components/schemas/ErrorResponse");
  }
}
