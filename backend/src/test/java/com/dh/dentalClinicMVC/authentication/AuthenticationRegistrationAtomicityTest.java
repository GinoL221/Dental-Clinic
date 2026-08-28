package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
// Keep this test outside a test-managed transaction so register() supplies the boundary under test.
class AuthenticationRegistrationAtomicityTest {

  @Autowired private AuthenticationService authenticationService;

  @Autowired private IAddressRepository addressRepository;

  @Autowired private IPatientRepository patientRepository;

  @Autowired private IUserRepository userRepository;

  @Test
  void whenPatientPersistenceFails_thenRegistrationAddressIsRolledBack() {
    int duplicateCardIdentity = 90123457;
    createExistingPatient(duplicateCardIdentity);
    String email = "atomic-registration-failure@test.com";
    long addressesBefore = addressRepository.count();

    RegisterRequest request =
        RegisterRequest.builder()
            .firstName("Atomic")
            .lastName("Registration")
            .email(email)
            .password("secret123")
            .role(Role.PATIENT)
            .cardIdentity(duplicateCardIdentity)
            .address(
                Address.builder()
                    .street("Rollback Street")
                    .number(123)
                    .location("Rollback City")
                    .province("Rollback Province")
                    .build())
            .build();

    assertThrows(
        DataIntegrityViolationException.class,
        () -> authenticationService.register(request),
        "Duplicate card identity should fail patient persistence");

    assertEquals(addressesBefore, addressRepository.count());
    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  private void createExistingPatient(int cardIdentity) {
    Patient patient = new Patient();
    patient.setFirstName("Existing");
    patient.setLastName("Patient");
    patient.setEmail("atomic-registration-existing@test.com");
    patient.setPassword("encoded-password");
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    patientRepository.saveAndFlush(patient);
  }
}
