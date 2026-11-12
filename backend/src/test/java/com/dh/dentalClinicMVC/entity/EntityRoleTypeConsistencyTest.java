package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pins the consistency invariant between {@code users.role} and the JOINED discriminator {@code
 * users.user_type}: Patient=PATIENT, Dentist=DENTIST, plain User=ADMIN.
 *
 * <p>Also records the exact discriminator strings Hibernate writes, since the V4 Flyway CHECK
 * constraint depends on them.
 */
@SpringBootTest
@Transactional
class EntityRoleTypeConsistencyTest {

  @Autowired private IPatientRepository patientRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IUserRepository userRepository;
  @Autowired private JdbcTemplate jdbcTemplate;
  @PersistenceContext private EntityManager entityManager;

  private Patient validPatient(Role role) {
    Patient patient = new Patient();
    patient.setFirstName("Ana");
    patient.setLastName("Garcia");
    patient.setEmail("ana-" + role + "@example.com");
    patient.setPassword("encoded");
    patient.setRole(role);
    patient.setCardIdentity(12345);
    patient.setAdmissionDate(LocalDate.of(2024, 1, 1));
    return patient;
  }

  private Dentist validDentist(Role role) {
    Dentist dentist = new Dentist();
    dentist.setFirstName("Bruno");
    dentist.setLastName("Diaz");
    dentist.setEmail("bruno-" + role + "@example.com");
    dentist.setPassword("encoded");
    dentist.setRole(role);
    dentist.setRegistrationNumber(6789);
    return dentist;
  }

  private User validPlainUser(Role role) {
    User user = new User();
    user.setFirstName("Ada");
    user.setLastName("Admin");
    user.setEmail("ada-" + role + "@example.com");
    user.setPassword("encoded");
    user.setRole(role);
    return user;
  }

  /** Discovery: exact discriminator strings written by Hibernate for each concrete kind. */
  @Test
  void discriminatorValuesMatchRolesForEveryUserKind() {
    Patient patient = patientRepository.save(validPatient(Role.PATIENT));
    Dentist dentist = dentistRepository.save(validDentist(Role.DENTIST));
    User admin = userRepository.save(validPlainUser(Role.ADMIN));
    entityManager.flush();

    Map<String, String> patientRaw = readRaw(patient.getId());
    Map<String, String> dentistRaw = readRaw(dentist.getId());
    Map<String, String> adminRaw = readRaw(admin.getId());

    assertEquals("PATIENT", patientRaw.get("role"), "patient row role");
    assertEquals("DENTIST", dentistRaw.get("role"), "dentist row role");
    assertEquals("ADMIN", adminRaw.get("role"), "admin row role");

    // Exact discriminator strings Hibernate persists in users.user_type.
    assertEquals("Patient", patientRaw.get("user_type"), "patient discriminator");
    assertEquals("Dentist", dentistRaw.get("user_type"), "dentist discriminator");
    assertEquals("User", adminRaw.get("user_type"), "plain user discriminator");
  }

  @Test
  void patientWithDentistRoleIsRejected() {
    IllegalStateException exception =
        expectGuardViolation(
            () -> patientRepository.save(validPatient(Role.DENTIST)),
            "a Patient must not carry role DENTIST");
    assertTrue(containsAll(exceptionMessage(exception)), exceptionMessage(exception));
    assertTrue(exceptionMessage(exception).contains("DENTIST"), exceptionMessage(exception));
  }

  @Test
  void dentistWithPatientRoleIsRejected() {
    IllegalStateException exception =
        expectGuardViolation(
            () -> dentistRepository.save(validDentist(Role.PATIENT)),
            "a Dentist must not carry role PATIENT");
    assertTrue(containsAll(exceptionMessage(exception)), exceptionMessage(exception));
  }

  @Test
  void plainUserWithPatientRoleIsRejected() {
    IllegalStateException exception =
        expectGuardViolation(
            () -> userRepository.save(validPlainUser(Role.PATIENT)),
            "a plain User must not carry role PATIENT");
    assertTrue(containsAll(exceptionMessage(exception)), exceptionMessage(exception));
  }

  /** The guard must also fire on updates, not only at insert time. */
  @Test
  void roleMutationAfterPersistIsRejectedOnUpdate() {
    Patient patient = patientRepository.save(validPatient(Role.PATIENT));
    entityManager.flush();
    entityManager.clear();

    Patient managed = patientRepository.findById(patient.getId()).orElseThrow();
    managed.setRole(Role.DENTIST);
    IllegalStateException exception =
        expectGuardViolation(
            entityManager::flush,
            "@PreUpdate must reject a role that no longer matches the subclass");
    assertTrue(containsAll(exceptionMessage(exception)), exceptionMessage(exception));
  }

  /**
   * Repositories translate persistence exceptions; the guard itself throws IllegalStateException.
   */
  private IllegalStateException expectGuardViolation(Executable action, String description) {
    Exception thrown =
        assertThrows(Exception.class, action, description + " (illegal state expected)");
    Throwable current = thrown;
    while (current != null && !(current instanceof IllegalStateException)) {
      current = current.getCause();
    }
    if (current instanceof IllegalStateException illegalState) {
      return illegalState;
    }
    throw new AssertionError(
        description + " but no IllegalStateException was found in the cause chain", thrown);
  }

  private boolean containsAll(String message) {
    return message != null && message.contains("role") && message.contains("user_type");
  }

  private String exceptionMessage(Throwable exception) {
    Throwable current = exception;
    while (current != null) {
      if (current.getMessage() != null && !current.getMessage().isBlank()) {
        return current.getMessage();
      }
      current = current.getCause();
    }
    return "";
  }

  private Map<String, String> readRaw(Long id) {
    return jdbcTemplate.queryForObject(
        "SELECT user_type, role FROM users WHERE id = ?",
        (rs, rowNum) -> {
          String userType = rs.getString("user_type");
          String role = rs.getString("role");
          assertNotNull(userType, "user_type must not be null");
          assertNotNull(role, "role must not be null");
          return Map.of("user_type", userType, "role", role);
        },
        id);
  }
}
