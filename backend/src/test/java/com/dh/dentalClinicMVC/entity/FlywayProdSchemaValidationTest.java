package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Verifies that JPA entities pass {@code hibernate.ddl-auto=validate} against the schema created by
 * Flyway V1-V4 in MySQL compatibility mode.
 */
@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:flywayvalidate;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.flyway.enabled=true",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg="
    })
class FlywayProdSchemaValidationTest {

  @Autowired private JdbcTemplate jdbcTemplate;

  @Test
  void flywayV1ToV4PassesHibernateValidate() {
    Integer applied =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"flyway_schema_history\" WHERE \"version\" IN ('1','2','3','4')",
            Integer.class);
    assertTrue(applied != null && applied == 4, "All Flyway migrations V1-V4 must be applied");
  }
}
