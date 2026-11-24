package com.dh.dentalClinicMVC.integration;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

/**
 * Base class for integration tests running against a single shared disposable MySQL 8.4
 * Testcontainers instance with Flyway V1-V4 and Hibernate schema validation enabled. Skipped
 * automatically when Docker is unavailable on a local machine.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(
    properties = {
      "spring.flyway.enabled=true",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg=",
      "app.rate-limit.auth.enabled=false"
    })
@AutoConfigureMockMvc
@Import(MySqlTestcontainersConfig.class)
public abstract class AbstractMySqlIntegrationTest {

  @Autowired protected MockMvc mockMvc;

  @Autowired protected ObjectMapper objectMapper;

  @Autowired protected JdbcTemplate jdbcTemplate;

  @Autowired protected JwtService jwtService;

  @Autowired protected IUserRepository userRepository;

  @Autowired protected PasswordEncoder passwordEncoder;

  @Autowired(required = false)
  private CacheManager cacheManager;

  @BeforeEach
  void cleanDatabaseAndCaches() {
    // Delete in strict FK child-to-parent order inside the disposable Testcontainers MySQL 8.4 DB.
    jdbcTemplate.update("DELETE FROM appointments");
    jdbcTemplate.update("DELETE FROM dentist_specialty");
    jdbcTemplate.update("DELETE FROM patients");
    jdbcTemplate.update("DELETE FROM dentists");
    jdbcTemplate.update("DELETE FROM addresses");
    jdbcTemplate.update("DELETE FROM specialties");
    jdbcTemplate.update("DELETE FROM users");

    if (cacheManager != null) {
      for (String cacheName : cacheManager.getCacheNames()) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
          cache.clear();
        }
      }
    }
  }

  protected String seedAdminAndGetBearerToken(String email) {
    User admin = new User();
    admin.setFirstName("Admin");
    admin.setLastName("MySql");
    admin.setEmail(email);
    admin.setPassword(passwordEncoder.encode("AdminPass123!"));
    admin.setRole(Role.ADMIN);
    admin.setMustChangePassword(false);
    User saved = userRepository.save(admin);
    return "Bearer " + jwtService.generateToken(saved);
  }

  protected static LocalDate nextWeekday() {
    LocalDate date = LocalDate.now().plusDays(1);
    while (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
      date = date.plusDays(1);
    }
    return date;
  }
}
