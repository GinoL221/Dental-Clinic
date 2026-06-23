package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Item 2a: DentistController.update() IDOR + privilege escalation, mirroring
// PatientControllerAuthzTest. DentistController.findById() is unchanged
// (already hasRole('ADMIN')-only per design Decision 3 / proposal — confirmed,
// not retested here since this is a no-change regression area).
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

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IDentistRepository dentistRepository;

    private Dentist seedDentist(String email, int registrationNumber, String firstName, String lastName) {
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
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        ));
        return SecurityMockMvcRequestPostProcessors.securityContext(context);
    }

    @Test
    public void whenDentistUpdatesOwnRecordWithOwnData_thenSucceeds() throws Exception {
        Dentist own = seedDentist("self-update-dentist@test.com", 80001, "Original", "Name");

        Map<String, Object> body = new HashMap<>();
        body.put("id", own.getId());
        body.put("firstName", "Updated");
        body.put("lastName", "Name");

        mockMvc.perform(put("/dentists")
                        .with(csrf())
                        .with(authAs("self-update-dentist@test.com", "DENTIST"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
        assertEquals("Updated", reloaded.getFirstName());
    }

    @Test
    public void whenDentistSendsVictimIdInBody_thenVictimRecordUnchanged() throws Exception {
        seedDentist("attacker-dentist@test.com", 80002, "Attacker", "Self");
        Dentist victim = seedDentist("victim-dentist@test.com", 80003, "Victim", "Original");

        Map<String, Object> body = new HashMap<>();
        body.put("id", victim.getId());
        body.put("firstName", "Hijacked");
        body.put("lastName", "Hijacked");
        body.put("email", "victim-dentist-hijacked@test.com");
        body.put("role", "ADMIN");

        mockMvc.perform(put("/dentists")
                        .with(csrf())
                        .with(authAs("attacker-dentist@test.com", "DENTIST"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Dentist reloadedVictim = dentistRepository.findById(victim.getId()).orElseThrow();
        assertEquals("Victim", reloadedVictim.getFirstName(), "Victim firstName must be untouched");
        assertEquals("Original", reloadedVictim.getLastName(), "Victim lastName must be untouched");
        assertEquals("victim-dentist@test.com", reloadedVictim.getEmail(), "Victim email must be untouched");
        assertEquals(Role.DENTIST, reloadedVictim.getRole(), "Victim role must be untouched");
    }

    @Test
    public void whenDentistSendsRoleAdminInBody_thenCallerRoleNeverBecomesAdmin() throws Exception {
        Dentist own = seedDentist("wannabe-admin-dentist@test.com", 80004, "Wanna", "Be");

        Map<String, Object> body = new HashMap<>();
        body.put("id", own.getId());
        body.put("firstName", "Wanna");
        body.put("role", "ADMIN");

        mockMvc.perform(put("/dentists")
                        .with(csrf())
                        .with(authAs("wannabe-admin-dentist@test.com", "DENTIST"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
        assertTrue(reloaded.getRole() != Role.ADMIN, "Caller role must never become ADMIN, was " + reloaded.getRole());
    }

    @Test
    public void whenAdminUpdatesAnyDentistById_thenSucceeds() throws Exception {
        Dentist target = seedDentist("admin-target-dentist@test.com", 80005, "Before", "Admin");

        Map<String, Object> body = new HashMap<>();
        body.put("id", target.getId());
        body.put("firstName", "After");

        mockMvc.perform(put("/dentists")
                        .with(csrf())
                        .with(authAs("admin-dentist@test.com", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Dentist reloaded = dentistRepository.findById(target.getId()).orElseThrow();
        assertEquals("After", reloaded.getFirstName());
    }
}
