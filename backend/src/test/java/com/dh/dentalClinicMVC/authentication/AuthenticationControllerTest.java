package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@Rollback
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IUserRepository userRepository;

    // Item 6: PUT /auth/update-names/{email} must not exist as a route anymore.
    // Deliberately omit the (formerly) required firstName/lastName query params:
    // while the route existed, Spring would reject this with 400 (missing
    // required @RequestParam) before the method body ran. With the route gone,
    // the DispatcherServlet has no handler mapped at all and returns 404. This
    // distinguishes "route removed" from the old method's own "user not found"
    // 404, which would have produced the same status code as a false positive.
    @Test
    public void whenPutUpdateNames_thenRouteNotFound() throws Exception {
        mockMvc.perform(put("/auth/update-names/any@x.com"))
                .andExpect(status().isNotFound());
    }

    // Item 1: public registration must reject role=ADMIN with 400, and must
    // not create any ADMIN account as a side effect (verified via repository,
    // not just the HTTP response).
    @Test
    public void whenRegisterWithRoleAdmin_thenBadRequestAndNoAdminPersisted() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "Hacker");
        body.put("lastName", "Tries");
        body.put("email", "hacker-admin@test.com");
        body.put("password", "secret123");
        body.put("role", "ADMIN");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());

        assertTrue(userRepository.findByEmail("hacker-admin@test.com").isEmpty(),
                "No account should have been persisted for a rejected ADMIN self-registration");
    }

    // Item 1: role=PATIENT registration is unchanged by the new guard.
    @Test
    public void whenRegisterWithRolePatient_thenSucceedsAsPatient() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "Pat");
        body.put("lastName", "Ient");
        body.put("email", "pat-role-patient@test.com");
        body.put("password", "secret123");
        body.put("role", "PATIENT");
        body.put("cardIdentity", 90011001);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Role persistedRole = userRepository.findByEmail("pat-role-patient@test.com")
                .orElseThrow(() -> new AssertionError("Expected a persisted PATIENT account"))
                .getRole();
        assertTrue(persistedRole == Role.PATIENT, "Expected persisted role to be PATIENT, was " + persistedRole);
    }

    // Item 1: a request with no role field at all must default to PATIENT,
    // not NPE. Pre-fix, request.getRole() == null fed directly into a switch
    // statement on the primitive-unboxing-free enum, which throws NPE on null.
    @Test
    public void whenRegisterWithNoRoleField_thenDefaultsToPatient() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("firstName", "No");
        body.put("lastName", "Role");
        body.put("email", "no-role-field@test.com");
        body.put("password", "secret123");
        body.put("cardIdentity", 90011002);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        Role persistedRole = userRepository.findByEmail("no-role-field@test.com")
                .orElseThrow(() -> new AssertionError("Expected a persisted PATIENT account"))
                .getRole();
        assertTrue(persistedRole == Role.PATIENT, "Expected persisted role to be PATIENT, was " + persistedRole);
    }
}
