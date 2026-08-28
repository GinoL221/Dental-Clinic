package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.repository.IUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:data-initializer-prod-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg="
    })
class DataInitializerProfileTest {
  private static final String SEEDED_ADMIN_EMAIL = "admin@dentalclinic.com";

  @Autowired private ApplicationContext applicationContext;

  @Autowired private IUserRepository userRepository;

  @Test
  void productionProfileDisablesDemoInitializerAndDoesNotSeedAdmin() {
    assertTrue(
        applicationContext.getBeansOfType(DataInitializer.class).isEmpty(),
        "DataInitializer must be absent under the prod profile");
    assertTrue(
        userRepository.findByEmail(SEEDED_ADMIN_EMAIL).isEmpty(),
        "The dev-only seeded admin must not exist under the prod profile");
  }
}
