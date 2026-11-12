package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Runs Flyway V1-V4 against H2 in MySQL compatibility mode and proves the V4 CHECK constraint
 * rejects a role that contradicts users.user_type while accepting consistent data.
 *
 * <p>Uses a dedicated in-memory database and {@code ddl-auto=none} so Hibernate never touches the
 * Flyway-managed schema: what is under test is exactly the SQL that runs in prod.
 */
@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:flywayv4check;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.flyway.enabled=true",
      "spring.jpa.hibernate.ddl-auto=none",
      "spring.sql.init.mode=never"
    })
class FlywayV4UserTypeCheckTest {

  @Autowired private JdbcTemplate jdbcTemplate;

  @Test
  void v4CheckConstraintGuardsRoleAgainstUserType() {
    Integer applied =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"flyway_schema_history\" WHERE \"version\" = '4'",
            Integer.class);
    assertTrue(applied != null && applied == 1, "V4 must be applied by Flyway before this test");

    // Consistent plain admin row is accepted.
    jdbcTemplate.update(
        "INSERT INTO users (user_type, email, first_name, last_name, password, role,"
            + " must_change_password) VALUES ('User', 'v4-admin@example.com', 'A', 'D', 'x',"
            + " 'ADMIN', FALSE)");

    // First ensure a consistent patient row is accepted, then try to corrupt its role.
    jdbcTemplate.update(
        "INSERT INTO users (user_type, email, first_name, last_name, password, role,"
            + " must_change_password) VALUES ('Patient', 'v4-patient@example.com', 'A', 'G', 'x',"
            + " 'PATIENT', FALSE)");
    assertDoesNotThrow(
        () ->
            jdbcTemplate.update(
                "UPDATE users SET role = 'PATIENT' WHERE email = 'v4-patient@example.com'"));

    // Setting a role that contradicts the discriminator must be rejected by the CHECK.
    assertThrows(
        DataAccessException.class,
        () ->
            jdbcTemplate.update(
                "UPDATE users SET role = 'DENTIST' WHERE email = 'v4-patient@example.com'"),
        "V4 CHECK must reject role inconsistent with user_type");
  }
}
