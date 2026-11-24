package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.integration.AbstractMySqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;

/**
 * Verifies Flyway migrations V1-V4, Hibernate schema validation (ddl-auto=validate), and the real
 * MySQL 8 CHECK constraint (V4) against a disposable MySQL 8 container. Skipped automatically when
 * Docker is unavailable on a local machine.
 */
class MySqlFlywaySchemaTest extends AbstractMySqlIntegrationTest {

  @Test
  void flywayMigrationsPassHibernateValidateAndEnforceV4CheckConstraintOnRealMySql() {
    Integer applied =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('1','2','3','4')",
            Integer.class);
    assertTrue(
        applied != null && applied == 4, "All Flyway migrations V1-V4 must be applied on MySQL 8");

    // Consistent user_type/role combination must succeed
    assertDoesNotThrow(
        () ->
            jdbcTemplate.update(
                "INSERT INTO users (user_type, first_name, last_name, email, password, role, must_change_password) "
                    + "VALUES ('User', 'Admin', 'MySQL', 'admin.mysql@test.local', 'hash', 'ADMIN', false)"));

    // Contradictory user_type/role must be rejected by real MySQL 8 CHECK constraint (V4)
    assertThrows(
        DataAccessException.class,
        () ->
            jdbcTemplate.update(
                "INSERT INTO users (user_type, first_name, last_name, email, password, role, must_change_password) "
                    + "VALUES ('Patient', 'Bad', 'Role', 'bad.role@test.local', 'hash', 'ADMIN', false)"));
  }
}
