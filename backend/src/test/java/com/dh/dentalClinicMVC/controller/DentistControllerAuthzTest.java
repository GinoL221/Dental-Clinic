package com.dh.dentalClinicMVC.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
import tools.jackson.databind.ObjectMapper;

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
  public void
      whenDentistUpdatesOwnRecordWithDifferentRegistrationNumber_thenRegistrationNumberIsPreservedNotOverwritten()
          throws Exception {
    Dentist another = seedDentist("registrationnumber-taken@test.com", 80013, "Taken", "Slot");
    Dentist own = seedDentist("registrationnumber-owner@test.com", 80014, "Original", "Name");

    // Submits another dentist's registrationNumber: if applied as-is this would hit the unique
    // constraint; it must instead be silently ignored (preserved), like email already is.
    Map<String, Object> body =
        fullUpdateBody(
            "Updated",
            "Name",
            "registrationnumber-owner@test.com",
            another.getRegistrationNumber());

    mockMvc
        .perform(
            put("/dentists/{id}", own.getId())
                .with(csrf())
                .with(authAs("registrationnumber-owner@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
    assertEquals("Updated", reloaded.getFirstName(), "Other fields must still update");
    assertEquals(
        80014,
        reloaded.getRegistrationNumber(),
        "Self-update must not change registrationNumber even when another dentist's is submitted");
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
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("Acceso denegado"))
        .andExpect(jsonPath("$.status").value(403))
        .andExpect(jsonPath("$.message").value("No tienes permisos para realizar esta acción"));

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

  // R3 (authz-cleanup-round-2, Phase 5.7): DENTIST principal with no backing
  // Dentist row (stale principal) must get 401, not 403 — see
  // specs/stale-principal-resolution/spec.md.
  @Test
  public void whenDentistHasNoBackingRecordOnUpdate_then401Unauthorized() throws Exception {
    Dentist victim =
        seedDentist("stale-update-victim-dentist@test.com", 80015, "Victim", "Untouched");

    Map<String, Object> body =
        fullUpdateBody("Hijacked", "Hijacked", "stale-update-victim-dentist@test.com", 80015);

    mockMvc
        .perform(
            put("/dentists/{id}", victim.getId())
                .with(csrf())
                .with(authAs("ghost-dentist@test.com", "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));

    Dentist reloadedVictim = dentistRepository.findById(victim.getId()).orElseThrow();
    assertEquals("Victim", reloadedVictim.getFirstName(), "Victim firstName must be untouched");
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

  @Test
  public void whenDentistRequestsOwnRecordById_thenSucceeds() throws Exception {
    Dentist own = seedDentist("self-get-dentist@test.com", 80020, "Self", "Dentist");

    mockMvc
        .perform(
            get("/dentists/{id}", own.getId())
                .with(authAs("self-get-dentist@test.com", "DENTIST"))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(own.getId()))
        .andExpect(jsonPath("$.firstName").value("Self"))
        .andExpect(jsonPath("$.email").value("self-get-dentist@test.com"));
  }

  @Test
  public void whenDentistRequestsOtherDentistRecordById_thenForbidden() throws Exception {
    seedDentist("attacker-reader@test.com", 80021, "Attacker", "Reader");
    Dentist victim = seedDentist("victim-target@test.com", 80022, "Victim", "Target");

    mockMvc
        .perform(
            get("/dentists/{id}", victim.getId())
                .with(authAs("attacker-reader@test.com", "DENTIST"))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("Acceso denegado"))
        .andExpect(jsonPath("$.status").value(403))
        .andExpect(jsonPath("$.message").value("No tienes permisos para realizar esta acción"));
  }

  // S1: 404 for a missing dentist by ID must carry the ErrorResponse body
  // (previously an empty body from the controller's null check).
  @Test
  public void whenAdminRequestsNonExistentDentistById_then404WithErrorBody() throws Exception {
    mockMvc
        .perform(
            get("/dentists/999999")
                .with(authAs("admin-404-dentist@test.com", "ADMIN"))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("Recurso no encontrado"))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.message").value("Odontólogo no encontrado con ID: 999999"));
  }

  // S1: 404 for a missing dentist by registration number must carry the
  // ErrorResponse body (previously an empty body from the Optional fallback).
  @Test
  public void whenRequestingNonExistentDentistByRegistrationNumber_then404WithErrorBody()
      throws Exception {
    mockMvc
        .perform(
            get("/dentists/registration/999999")
                .with(authAs("admin-404-reg@test.com", "ADMIN"))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("Recurso no encontrado"))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.message").value("Odontólogo no encontrado con matrícula: 999999"));
  }

  @Test
  public void whenAdminRequestsAnyDentistById_thenSucceeds() throws Exception {
    Dentist target = seedDentist("admin-read-target@test.com", 80023, "Target", "Doctor");

    mockMvc
        .perform(
            get("/dentists/{id}", target.getId())
                .with(authAs("admin-reader@test.com", "ADMIN"))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(target.getId()));
  }
}
