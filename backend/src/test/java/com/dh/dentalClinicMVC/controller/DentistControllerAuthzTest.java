package com.dh.dentalClinicMVC.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

// Item 2a: DentistController.update() IDOR + privilege escalation, mirroring
// PatientControllerAuthzTest.
//
// Update target now comes from the path (`PUT /dentists/{id}`), not the
// body: DentistRequestDTO structurally excludes `id`/`role`, so there is
// nothing left to strip. Non-admin path-id vs own-id mismatch is now a
// 403 (hardened from the previous "silently redirect to own record"
// behavior) — see design.md Decision 3.
//
// Full security filter chain (not addFilters=false) required: update() takes
// an `Authentication` parameter resolved from the servlet principal, which is
// only populated when the filter chain actually runs. See
// PatientControllerAuthzTest for the detailed rationale.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class DentistControllerAuthzTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private IDentistRepository dentistRepository;

  private Dentist seedDentist(
      String email, int registrationNumber, String firstName, String lastName) {
    Dentist dentist = new Dentist();
    dentist.setEmail(email);
    dentist.setFirstName(firstName);
    dentist.setLastName(lastName);
    dentist.setPassword("irrelevant-hash");
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(registrationNumber);
    return dentistRepository.save(dentist);
  }

  private static RequestPostProcessor authAs(String email, String role) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  // Full editable-field-set body matching DentistRequestDTO (D1: full-replace PUT).
  private static Map<String, Object> fullUpdateBody(
      String firstName, String lastName, String email, int registrationNumber) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", firstName);
    body.put("lastName", lastName);
    body.put("email", email);
    body.put("registrationNumber", registrationNumber);
    return body;
  }

  @Test
  public void whenDentistUpdatesOwnRecordWithFullPayload_thenSucceeds() throws Exception {
    Dentist own = seedDentist("self-update-dentist@test.com", 80001, "Original", "Name");

    Map<String, Object> body =
        fullUpdateBody("Updated", "Name", "self-update-dentist@test.com", 80001);

    mockMvc
        .perform(
            put("/dentists/{id}", own.getId())
                .with(csrf())
                .with(authAs("self-update-dentist@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
    assertEquals("Updated", reloaded.getFirstName());
  }

  @Test
  public void whenDentistUpdatesOwnRecordWithDifferentEmail_thenEmailIsPreservedNotOverwritten()
      throws Exception {
    Dentist own = seedDentist("original-email-dentist@test.com", 80012, "Original", "Name");

    Map<String, Object> body =
        fullUpdateBody("Updated", "Name", "attempted-new-email-dentist@test.com", 80012);

    mockMvc
        .perform(
            put("/dentists/{id}", own.getId())
                .with(csrf())
                .with(authAs("original-email-dentist@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
    assertEquals("Updated", reloaded.getFirstName(), "Other fields must still update");
    assertEquals(
        "original-email-dentist@test.com",
        reloaded.getEmail(),
        "Self-update must not change email even when a different one is submitted");
  }

  @Test
  public void whenDentistRequestsUpdateOfDifferentPathId_thenForbiddenAndVictimUnchanged()
      throws Exception {
    seedDentist("attacker-dentist@test.com", 80002, "Attacker", "Self");
    Dentist victim = seedDentist("victim-dentist@test.com", 80003, "Victim", "Original");

    Map<String, Object> body =
        fullUpdateBody("Hijacked", "Hijacked", "victim-dentist-hijacked@test.com", 80003);

    mockMvc
        .perform(
            put("/dentists/{id}", victim.getId())
                .with(csrf())
                .with(authAs("attacker-dentist@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden());

    Dentist reloadedVictim = dentistRepository.findById(victim.getId()).orElseThrow();
    assertEquals("Victim", reloadedVictim.getFirstName(), "Victim firstName must be untouched");
    assertEquals("Original", reloadedVictim.getLastName(), "Victim lastName must be untouched");
    assertEquals(
        "victim-dentist@test.com", reloadedVictim.getEmail(), "Victim email must be untouched");
    assertEquals(Role.DENTIST, reloadedVictim.getRole(), "Victim role must be untouched");
  }

  @Test
  public void whenDentistSendsInjectedIdAndRoleInBody_thenIgnored() throws Exception {
    Dentist own = seedDentist("wannabe-admin-dentist@test.com", 80004, "Wanna", "Be");
    Dentist other = seedDentist("other-row-dentist@test.com", 80011, "Other", "Row");

    Map<String, Object> body =
        fullUpdateBody("Wanna", "Be", "wannabe-admin-dentist@test.com", 80004);
    body.put("id", other.getId()); // structurally ignored: DentistRequestDTO has no id field
    body.put("role", "ADMIN"); // structurally ignored: DentistRequestDTO has no role field

    mockMvc
        .perform(
            put("/dentists/{id}", own.getId())
                .with(csrf())
                .with(authAs("wannabe-admin-dentist@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloadedOwn = dentistRepository.findById(own.getId()).orElseThrow();
    assertTrue(
        reloadedOwn.getRole() != Role.ADMIN,
        "Caller role must never become ADMIN, was " + reloadedOwn.getRole());

    Dentist reloadedOther = dentistRepository.findById(other.getId()).orElseThrow();
    assertEquals(
        "Other",
        reloadedOther.getFirstName(),
        "Injected body id must not redirect the update to another row");
  }

  @Test
  public void whenAdminUpdatesAnyDentistByPathId_thenSucceeds() throws Exception {
    Dentist target = seedDentist("admin-target-dentist@test.com", 80005, "Before", "Admin");

    Map<String, Object> body =
        fullUpdateBody("After", "Admin", "admin-target-dentist@test.com", 80005);

    mockMvc
        .perform(
            put("/dentists/{id}", target.getId())
                .with(csrf())
                .with(authAs("admin-dentist@test.com", "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloaded = dentistRepository.findById(target.getId()).orElseThrow();
    assertEquals("After", reloaded.getFirstName());
  }
}
