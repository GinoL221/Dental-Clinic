package com.dh.dentalClinicMVC.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
}
