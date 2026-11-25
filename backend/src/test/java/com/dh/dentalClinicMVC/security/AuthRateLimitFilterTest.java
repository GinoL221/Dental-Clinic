package com.dh.dentalClinicMVC.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.support.WithMockAppUser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(
    properties = {
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg=",
      "app.rate-limit.auth.enabled=true",
      "app.rate-limit.auth.max-requests=3",
      "app.rate-limit.auth.window-seconds=60"
    })
class AuthRateLimitFilterTest {

  @Autowired private MockMvc mockMvc;

  private static RequestPostProcessor fromIp(String ip) {
    return request -> {
      request.setRemoteAddr(ip);
      return request;
    };
  }

  @Test
  @DisplayName(
      "Login rate limiter returns 429 ErrorResponse after max requests per IP and isolates other IPs")
  void loginRateLimiterEnforcesLimitPerIpAndReturns429ErrorResponse() throws Exception {
    String payload = "{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}";

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              post("/auth/login")
                  .with(fromIp("198.51.100.10"))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(payload))
          .andExpect(status().isUnauthorized());
    }

    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp("198.51.100.10"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().exists("Retry-After"))
        .andExpect(jsonPath("$.status").value(429))
        .andExpect(jsonPath("$.error").value("Demasiadas solicitudes"))
        .andExpect(jsonPath("$.message").isNotEmpty())
        .andExpect(jsonPath("$.path").value("/auth/login"));

    // Different IP stays unaffected
    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp("198.51.100.11"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Register endpoint is rate-limited while healthcheck GET remains unaffected")
  void registerIsRateLimitedWhileHealthcheckStaysOpen() throws Exception {
    String invalidRegister = "{\"email\":\"bad\"}";

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              post("/auth/register")
                  .with(fromIp("198.51.100.12"))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(invalidRegister))
          .andExpect(status().isBadRequest());
    }

    mockMvc
        .perform(
            post("/auth/register")
                .with(fromIp("198.51.100.12"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRegister))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.status").value(429));

    mockMvc
        .perform(get("/actuator/health").with(fromIp("198.51.100.12")))
        .andExpect(status().isOk());
  }

  @Test
  @WithMockAppUser(username = "admin@example.com", role = Role.ADMIN)
  @DisplayName(
      "GET /auth/check-email is rate-limited and returns 429 ErrorResponse with Retry-After")
  void checkEmailIsRateLimitedAndReturns429ErrorResponse() throws Exception {
    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              get("/auth/check-email")
                  .param("email", "test@example.com")
                  .with(fromIp("198.51.100.13")))
          .andExpect(status().isOk());
    }

    mockMvc
        .perform(
            get("/auth/check-email")
                .param("email", "test@example.com")
                .with(fromIp("198.51.100.13")))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().exists("Retry-After"))
        .andExpect(jsonPath("$.status").value(429))
        .andExpect(jsonPath("$.error").value("Demasiadas solicitudes"))
        .andExpect(jsonPath("$.message").isNotEmpty())
        .andExpect(jsonPath("$.path").value("/auth/check-email"));
  }

  @Test
  @WithMockAppUser(username = "admin@example.com", role = Role.ADMIN)
  @DisplayName("HEAD /auth/check-email is rate-limited and returns 429 after max requests")
  void headCheckEmailIsRateLimitedAndReturns429() throws Exception {
    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              head("/auth/check-email")
                  .param("email", "test@example.com")
                  .with(fromIp("198.51.100.15")))
          .andExpect(status().isOk());
    }

    mockMvc
        .perform(
            head("/auth/check-email")
                .param("email", "test@example.com")
                .with(fromIp("198.51.100.15")))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().exists("Retry-After"));
  }

  @Test
  @WithMockAppUser(username = "admin@example.com", role = Role.ADMIN)
  @DisplayName("Exhausting GET /auth/check-email does not block POST /auth/login from the same IP")
  void checkEmailRateLimitDoesNotBlockLoginFromSameIp() throws Exception {
    String ip = "198.51.100.14";
    String loginPayload = "{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}";

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(get("/auth/check-email").param("email", "test@example.com").with(fromIp(ip)))
          .andExpect(status().isOk());
    }

    mockMvc
        .perform(get("/auth/check-email").param("email", "test@example.com").with(fromIp(ip)))
        .andExpect(status().isTooManyRequests());

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              post("/auth/login")
                  .with(fromIp(ip))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(loginPayload))
          .andExpect(status().isUnauthorized());
    }
  }

  @Test
  @WithMockAppUser(username = "admin@example.com", role = Role.ADMIN)
  @DisplayName(
      "POST /auth/login and POST /auth/register share the auth bucket while GET /auth/check-email stays isolated")
  void loginAndRegisterShareAuthBucketWhileCheckEmailStaysIsolated() throws Exception {
    String ip = "198.51.100.16";
    String loginPayload = "{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}";
    String invalidRegister = "{\"email\":\"bad\"}";

    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              post("/auth/login")
                  .with(fromIp(ip))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(loginPayload))
          .andExpect(status().isUnauthorized());
    }

    mockMvc
        .perform(
            post("/auth/register")
                .with(fromIp(ip))
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRegister))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().exists("Retry-After"))
        .andExpect(jsonPath("$.status").value(429))
        .andExpect(jsonPath("$.path").value("/auth/register"));

    mockMvc
        .perform(get("/auth/check-email").param("email", "test@example.com").with(fromIp(ip)))
        .andExpect(status().isOk());
  }
}
