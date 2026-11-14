package com.dh.dentalClinicMVC.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:swagger-prod-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.flyway.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg="
    })
class SwaggerProductionSecurityTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("Swagger UI should be disabled and return 404 under production profile")
  void swaggerUiShouldBeDisabledInProd() throws Exception {
    mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("OpenAPI v3 api-docs should be disabled and return 404 under production profile")
  void apiDocsShouldBeDisabledInProd() throws Exception {
    mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
  }
}
