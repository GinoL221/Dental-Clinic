package com.dh.dentalClinicMVC.security;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class MustChangePasswordAndH2BoundaryTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private IUserRepository userRepository;
  @Autowired private PasswordEncoder passwordEncoder;
  @Autowired private JwtService jwtService;

  @Test
  void mustChangePasswordUser_isQuarantinedToAuthMeAndChangePasswordUntilRotated()
      throws Exception {
    Dentist dentist = new Dentist();
    dentist.setFirstName("Temp");
    dentist.setLastName("Dentist");
    dentist.setEmail("temp.quarantine.dentist@test.com");
    dentist.setPassword(passwordEncoder.encode("TempPass123!"));
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(91001);
    dentist.setMustChangePassword(true);
    dentistRepository.save(dentist);

    String token = jwtService.generateToken(dentist);

    // Allowed while mustChangePassword=true: GET /auth/me
    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(true));

    // Denied while mustChangePassword=true: clinical endpoints return 403 ErrorResponse
    mockMvc
        .perform(get("/patients").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403))
        .andExpect(jsonPath("$.error").value("Acceso denegado"));

    mockMvc
        .perform(get("/appointments").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    // Allowed while mustChangePassword=true: POST /auth/change-password
    mockMvc
        .perform(
            post("/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"TempPass123!\",\"newPassword\":\"Rotated123!\"}"))
        .andExpect(status().isNoContent());

    // After rotation, clinical endpoints are accessible again
    mockMvc
        .perform(get("/patients").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());
  }

  @Test
  void unauthenticatedRequestToProtectedEndpoint_stillReturns401Unauthorized() throws Exception {
    mockMvc
        .perform(get("/patients"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void nonProdH2Console_requiresAdminRoleAndRejectsPatientAndDentist() throws Exception {
    Patient patient = new Patient();
    patient.setFirstName("Console");
    patient.setLastName("Patient");
    patient.setEmail("console.patient@test.com");
    patient.setPassword(passwordEncoder.encode("PatientPass123!"));
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(91002001);
    patient.setAdmissionDate(LocalDate.now());
    patientRepository.save(patient);

    Dentist dentist = new Dentist();
    dentist.setFirstName("Console");
    dentist.setLastName("Dentist");
    dentist.setEmail("console.dentist@test.com");
    dentist.setPassword(passwordEncoder.encode("DentistPass123!"));
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(91002);
    dentistRepository.save(dentist);

    User admin = new User();
    admin.setFirstName("Console");
    admin.setLastName("Admin");
    admin.setEmail("console.admin@test.com");
    admin.setPassword(passwordEncoder.encode("AdminPass123!"));
    admin.setRole(Role.ADMIN);
    userRepository.save(admin);

    String patientToken = jwtService.generateToken(patient);
    String dentistToken = jwtService.generateToken(dentist);
    String adminToken = jwtService.generateToken(admin);

    mockMvc.perform(get("/h2-console/")).andExpect(status().isUnauthorized());

    mockMvc
        .perform(get("/h2-console/").header("Authorization", "Bearer " + patientToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    mockMvc
        .perform(get("/h2-console/").header("Authorization", "Bearer " + dentistToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    mockMvc
        .perform(get("/h2-console/").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().is(not(401)))
        .andExpect(status().is(not(403)));
  }
}
