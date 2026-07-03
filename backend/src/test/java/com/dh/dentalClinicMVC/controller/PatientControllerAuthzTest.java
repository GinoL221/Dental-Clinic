package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Item 2a/2b: PatientController.update() IDOR + privilege escalation, and
// findById() self-scoping. Covers the allow/deny matrix from
// specs/object-level-authorization/spec.md.
//
// Update target now comes from the path (`PUT /patients/{id}`), not the
// body: PatientRequestDTO structurally excludes `id`/`role`, so there is
// nothing left to strip. Non-admin path-id vs own-id mismatch is now a
// 403 (hardened from the previous "silently redirect to own record"
// behavior) — see design.md Decision 3.
//
// Uses the full security filter chain (not addFilters=false) because the
// controller methods under test take an `Authentication` parameter resolved
// by Spring MVC's argument resolver, which reads HttpServletRequest's
// principal — only populated when the security filter chain actually runs.
// @WithMockUser alone (with addFilters=false) only seeds
// SecurityContextHolder for @PreAuthorize's AOP interceptor, not the
// servlet-level principal, and would NPE on the `Authentication` parameter.
// Same pattern already used in AppointmentControllerTest for this reason.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class PatientControllerAuthzTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IPatientRepository patientRepository;

    private Patient seedPatient(String email, int cardIdentity, String firstName, String lastName) {
        Patient patient = new Patient();
        patient.setEmail(email);
        patient.setFirstName(firstName);
        patient.setLastName(lastName);
        patient.setPassword("irrelevant-hash");
        patient.setRole(Role.PATIENT);
        patient.setCardIdentity(cardIdentity);
        patient.setAdmissionDate(LocalDate.now());
        return patientRepository.save(patient);
    }

    private static RequestPostProcessor authAs(String email, String role) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        ));
        return SecurityMockMvcRequestPostProcessors.securityContext(context);
    }

    // Full editable-field-set body matching PatientRequestDTO (D1: full-replace PUT).
    private static Map<String, Object> fullUpdateBody(String firstName, String lastName, String email, int cardIdentity) {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", firstName);
        body.put("lastName", lastName);
        body.put("email", email);
        body.put("cardIdentity", cardIdentity);
        body.put("admissionDate", LocalDate.now().toString());
        return body;
    }

    // --- update() ---

    @Test
    public void whenPatientUpdatesOwnRecordWithFullPayload_thenSucceeds() throws Exception {
        Patient own = seedPatient("self-update@test.com", 70001, "Original", "Name");

        Map<String, Object> body = fullUpdateBody("Updated", "Name", "self-update@test.com", 70001);

        mockMvc.perform(put("/patients/{id}", own.getId())
                        .with(csrf())
                        .with(authAs("self-update@test.com", "PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Patient reloaded = patientRepository.findById(own.getId()).orElseThrow();
        assertEquals("Updated", reloaded.getFirstName());
    }

    @Test
    public void whenPatientRequestsUpdateOfDifferentPathId_thenForbiddenAndVictimUnchanged() throws Exception {
        seedPatient("attacker@test.com", 70002, "Attacker", "Self");
        Patient victim = seedPatient("victim@test.com", 70003, "Victim", "Original");

        Map<String, Object> body = fullUpdateBody("Hijacked", "Hijacked", "victim-hijacked@test.com", 70003);

        mockMvc.perform(put("/patients/{id}", victim.getId())
                        .with(csrf())
                        .with(authAs("attacker@test.com", "PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());

        Patient reloadedVictim = patientRepository.findById(victim.getId()).orElseThrow();
        assertEquals("Victim", reloadedVictim.getFirstName(), "Victim firstName must be untouched");
        assertEquals("Original", reloadedVictim.getLastName(), "Victim lastName must be untouched");
        assertEquals("victim@test.com", reloadedVictim.getEmail(), "Victim email must be untouched");
        assertEquals(Role.PATIENT, reloadedVictim.getRole(), "Victim role must be untouched");
    }

    @Test
    public void whenPatientSendsInjectedIdAndRoleInBody_thenIgnored() throws Exception {
        Patient own = seedPatient("wannabe-admin@test.com", 70004, "Wanna", "Be");
        Patient other = seedPatient("other-row@test.com", 70011, "Other", "Row");

        Map<String, Object> body = fullUpdateBody("Wanna", "Be", "wannabe-admin@test.com", 70004);
        body.put("id", other.getId()); // structurally ignored: PatientRequestDTO has no id field
        body.put("role", "ADMIN");     // structurally ignored: PatientRequestDTO has no role field

        mockMvc.perform(put("/patients/{id}", own.getId())
                        .with(csrf())
                        .with(authAs("wannabe-admin@test.com", "PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Patient reloadedOwn = patientRepository.findById(own.getId()).orElseThrow();
        assertTrue(reloadedOwn.getRole() != Role.ADMIN, "Caller role must never become ADMIN, was " + reloadedOwn.getRole());

        Patient reloadedOther = patientRepository.findById(other.getId()).orElseThrow();
        assertEquals("Other", reloadedOther.getFirstName(), "Injected body id must not redirect the update to another row");
    }

    @Test
    public void whenAdminUpdatesAnyPatientByPathId_thenSucceeds() throws Exception {
        Patient target = seedPatient("admin-target@test.com", 70005, "Before", "Admin");

        Map<String, Object> body = fullUpdateBody("After", "Admin", "admin-target@test.com", 70005);

        mockMvc.perform(put("/patients/{id}", target.getId())
                        .with(csrf())
                        .with(authAs("admin@test.com", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Patient reloaded = patientRepository.findById(target.getId()).orElseThrow();
        assertEquals("After", reloaded.getFirstName());
    }

    // --- findById() --- (unchanged behavior; preserved as regression coverage)

    @Test
    public void whenPatientRequestsOwnId_thenOkWithOwnData() throws Exception {
        Patient own = seedPatient("find-self@test.com", 70006, "Find", "Self");

        mockMvc.perform(get("/patients/" + own.getId())
                        .with(authAs("find-self@test.com", "PATIENT"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Find"));
    }

    @Test
    public void whenPatientRequestsDifferentId_thenForbiddenNoDataLeaked() throws Exception {
        seedPatient("find-self-requester@test.com", 70007, "Requester", "Self");
        Patient other = seedPatient("find-other-victim@test.com", 70008, "Other", "Victim");

        mockMvc.perform(get("/patients/" + other.getId())
                        .with(authAs("find-self-requester@test.com", "PATIENT"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.firstName").doesNotExist());
    }

    @Test
    public void whenAdminRequestsAnyPatientId_thenOk() throws Exception {
        Patient target = seedPatient("admin-find-target@test.com", 70009, "Admin", "Visible");

        mockMvc.perform(get("/patients/" + target.getId())
                        .with(authAs("admin-find@test.com", "ADMIN"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Admin"));
    }

    @Test
    public void whenDentistRequestsAnyPatientId_thenOk() throws Exception {
        Patient target = seedPatient("dentist-find-target@test.com", 70010, "Dentist", "Visible");

        mockMvc.perform(get("/patients/" + target.getId())
                        .with(authAs("dentist-find@test.com", "DENTIST"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Dentist"));
    }
}
