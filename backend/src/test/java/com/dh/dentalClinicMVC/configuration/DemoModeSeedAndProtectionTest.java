package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.ISpecialtyRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:demo-mode-prod-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.flyway.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg=",
      "app.demo.enabled=true"
    })
class DemoModeSeedAndProtectionTest {

  @Autowired private ApplicationContext applicationContext;
  @Autowired private MockMvc mockMvc;
  @Autowired private IUserRepository userRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private ISpecialtyRepository specialtyRepository;
  @Autowired private IAppointmentRepository appointmentRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @Test
  void demoModeSeedsInProdWithoutEnablingDataInitializer() {
    assertTrue(
        applicationContext.getBeansOfType(DataInitializer.class).isEmpty(),
        "DataInitializer must remain absent under prod even when demo mode is enabled");
    assertTrue(userRepository.findByEmail("admin@dentalclinic.com").isPresent());
    assertTrue(userRepository.findByEmail("maria.gonzalez@dentalclinic.com").isPresent());
    assertTrue(userRepository.findByEmail("juan.perez@email.com").isPresent());
    assertEquals(6, specialtyRepository.count());
    assertEquals(4, dentistRepository.count());
    assertEquals(10, patientRepository.count());
    assertEquals(35, appointmentRepository.count());
  }

  @Test
  @WithMockUser(username = "admin@dentalclinic.com", roles = "ADMIN")
  void demoModeBlocksPasswordChangeForProtectedDemoAdmin() throws Exception {
    mockMvc
        .perform(
            post("/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"admin123\",\"newPassword\":\"NewPass123!\"}"))
        .andExpect(status().isConflict())
        .andExpect(
            jsonPath("$.message").value("No se puede cambiar la contraseña de una cuenta demo"));
  }

  @Test
  @WithMockUser(username = "admin@dentalclinic.com", roles = "ADMIN")
  void demoModeBlocksDeletingProtectedDemoDentistAndPatient() throws Exception {
    Dentist maria = dentistRepository.findByEmail("maria.gonzalez@dentalclinic.com").orElseThrow();
    Patient juan = patientRepository.findByEmail("juan.perez@email.com").orElseThrow();

    mockMvc
        .perform(delete("/dentists/" + maria.getId()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("No se puede eliminar una cuenta demo"));

    mockMvc
        .perform(delete("/patients/" + juan.getId()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").value("No se puede eliminar una cuenta demo"));
  }

  @Test
  @WithMockUser(username = "non-demo-patient@example.com", roles = "PATIENT")
  void demoModeAllowsPasswordChangeForNonDemoUsers() throws Exception {
    Patient nonDemo = new Patient();
    nonDemo.setFirstName("Visitor");
    nonDemo.setLastName("User");
    nonDemo.setEmail("non-demo-patient@example.com");
    nonDemo.setPassword(passwordEncoder.encode("secret123"));
    nonDemo.setRole(Role.PATIENT);
    nonDemo.setCardIdentity(99887766);
    nonDemo.setAdmissionDate(LocalDate.now());
    patientRepository.save(nonDemo);

    mockMvc
        .perform(
            post("/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"secret123\",\"newPassword\":\"Updated123!\"}"))
        .andExpect(status().isNoContent());
  }

  @Test
  @WithMockUser(username = "admin@dentalclinic.com", roles = "ADMIN")
  void demoModeBlocksRenamingOrChangingPasswordOfProtectedDemoAccountsViaPut() throws Exception {
    Dentist maria = dentistRepository.findByEmail("maria.gonzalez@dentalclinic.com").orElseThrow();
    Patient juan = patientRepository.findByEmail("juan.perez@email.com").orElseThrow();
    String mariaHash = maria.getPassword();
    String juanHash = juan.getPassword();

    mockMvc
        .perform(
            put("/dentists/" + maria.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"María\",\"lastName\":\"González\","
                        + "\"email\":\"renamed.maria@dentalclinic.com\","
                        + "\"registrationNumber\":"
                        + maria.getRegistrationNumber()
                        + "}"))
        .andExpect(status().isConflict())
        .andExpect(
            jsonPath("$.message")
                .value("No se pueden modificar las credenciales de una cuenta demo"));

    mockMvc
        .perform(
            put("/dentists/" + maria.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"María\",\"lastName\":\"González\","
                        + "\"email\":\"maria.gonzalez@dentalclinic.com\","
                        + "\"registrationNumber\":"
                        + maria.getRegistrationNumber()
                        + ",\"password\":\"Hijacked123!\"}"))
        .andExpect(status().isConflict())
        .andExpect(
            jsonPath("$.message")
                .value("No se pueden modificar las credenciales de una cuenta demo"));

    mockMvc
        .perform(
            put("/patients/" + juan.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"Juan\",\"lastName\":\"Pérez\","
                        + "\"email\":\"renamed.juan@email.com\","
                        + "\"cardIdentity\":"
                        + juan.getCardIdentity()
                        + ",\"admissionDate\":\""
                        + juan.getAdmissionDate()
                        + "\"}"))
        .andExpect(status().isConflict())
        .andExpect(
            jsonPath("$.message")
                .value("No se pueden modificar las credenciales de una cuenta demo"));

    mockMvc
        .perform(
            put("/patients/" + juan.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"Juan\",\"lastName\":\"Pérez\","
                        + "\"email\":\"juan.perez@email.com\","
                        + "\"cardIdentity\":"
                        + juan.getCardIdentity()
                        + ",\"admissionDate\":\""
                        + juan.getAdmissionDate()
                        + "\",\"password\":\"Hijacked123!\"}"))
        .andExpect(status().isConflict())
        .andExpect(
            jsonPath("$.message")
                .value("No se pueden modificar las credenciales de una cuenta demo"));

    Dentist reloadedMaria = dentistRepository.findById(maria.getId()).orElseThrow();
    Patient reloadedJuan = patientRepository.findById(juan.getId()).orElseThrow();
    assertEquals("maria.gonzalez@dentalclinic.com", reloadedMaria.getEmail());
    assertEquals(mariaHash, reloadedMaria.getPassword());
    assertEquals("juan.perez@email.com", reloadedJuan.getEmail());
    assertEquals(juanHash, reloadedJuan.getPassword());
  }

  @Test
  @WithMockUser(username = "admin@dentalclinic.com", roles = "ADMIN")
  void demoModeAllowsUpdatingNonCredentialFieldsOfProtectedDemoAccount() throws Exception {
    Dentist maria = dentistRepository.findByEmail("maria.gonzalez@dentalclinic.com").orElseThrow();

    mockMvc
        .perform(
            put("/dentists/" + maria.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"María\",\"lastName\":\"González\","
                        + "\"email\":\"maria.gonzalez@dentalclinic.com\","
                        + "\"registrationNumber\":"
                        + maria.getRegistrationNumber()
                        + "}"))
        .andExpect(status().isOk());
  }
}
