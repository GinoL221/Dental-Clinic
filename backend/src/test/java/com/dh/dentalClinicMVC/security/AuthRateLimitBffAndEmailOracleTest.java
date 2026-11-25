package com.dh.dentalClinicMVC.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.InputStream;
import java.util.Properties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(
    properties = {
      "app.rate-limit.auth.enabled=true",
      "app.rate-limit.auth.max-requests=2",
      "app.rate-limit.auth.window-seconds=60",
      "app.rate-limit.bff-shared-secret=test-bff-shared-secret-value"
    })
class AuthRateLimitBffAndEmailOracleTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  private static RequestPostProcessor fromIp(String ip) {
    return request -> {
      request.setRemoteAddr(ip);
      return request;
    };
  }

  @Test
  @DisplayName("Trusted BFF secret isolates per-client rate-limit buckets behind same BFF IP")
  void bffTrustedSecretIsolatesDistinctClientIpsBehindSameBffSocket() throws Exception {
    String payload = "{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}";
    String bffPeerIp = "10.0.0.50";

    for (int i = 0; i < 2; i++) {
      mockMvc
          .perform(
              post("/auth/login")
                  .with(fromIp(bffPeerIp))
                  .header("X-BFF-Auth", "test-bff-shared-secret-value")
                  .header("X-Client-IP", "203.0.113.10")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(payload))
          .andExpect(status().isUnauthorized());
    }

    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp(bffPeerIp))
                .header("X-BFF-Auth", "test-bff-shared-secret-value")
                .header("X-Client-IP", "203.0.113.10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().exists("Retry-After"));

    // Different end-user IP via the same BFF peer IP stays unaffected
    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp(bffPeerIp))
                .header("X-BFF-Auth", "test-bff-shared-secret-value")
                .header("X-Client-IP", "203.0.113.11")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Wrong or missing X-BFF-Auth ignores spoofed X-Client-IP fail-closed")
  void invalidOrMissingBffSecretIgnoresSpoofedClientIp() throws Exception {
    String payload = "{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}";
    String attackerPeerIp = "198.51.100.77";

    for (int i = 0; i < 2; i++) {
      mockMvc
          .perform(
              post("/auth/login")
                  .with(fromIp(attackerPeerIp))
                  .header("X-BFF-Auth", "wrong-secret")
                  .header("X-Client-IP", "203.0.113." + (20 + i))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(payload))
          .andExpect(status().isUnauthorized());
    }

    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp(attackerPeerIp))
                .header("X-BFF-Auth", "wrong-secret")
                .header("X-Client-IP", "203.0.113.99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isTooManyRequests());
  }

  @Test
  @DisplayName("Unconfigured/empty BFF secret never trusts empty X-BFF-Auth header")
  void emptyConfiguredBffSecretFailsClosed() throws Exception {
    AuthRateLimitFilter filter = new AuthRateLimitFilter(objectMapper, true, 2, 60);

    for (int i = 0; i < 2; i++) {
      MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
      req.setContextPath("/api");
      req.setRemoteAddr("198.51.100.88");
      req.addHeader("X-BFF-Auth", "");
      req.addHeader("X-Client-IP", "203.0.113." + (30 + i));
      MockHttpServletResponse res = new MockHttpServletResponse();
      filter.doFilter(req, res, new MockFilterChain());
      assertEquals(200, res.getStatus());
    }

    MockHttpServletRequest third = new MockHttpServletRequest("POST", "/api/auth/login");
    third.setContextPath("/api");
    third.setRemoteAddr("198.51.100.88");
    third.addHeader("X-BFF-Auth", "");
    third.addHeader("X-Client-IP", "203.0.113.199");
    MockHttpServletResponse thirdRes = new MockHttpServletResponse();
    filter.doFilter(third, thirdRes, new MockFilterChain());
    assertEquals(429, thirdRes.getStatus());
  }

  @Test
  @DisplayName(
      "Trusted BFF accepts valid IPv6 client tokens and falls back to remoteAddr on malformed or missing X-Client-IP")
  void trustedBffValidatesClientIpTokensAndSupportsIpv6() throws Exception {
    AuthRateLimitFilter filter =
        new AuthRateLimitFilter(objectMapper, true, 1, 60, "valid-bff-secret");

    // Valid IPv6 client A hits limit independently of IPv6 client B
    MockHttpServletRequest ipv6A1 = new MockHttpServletRequest("POST", "/api/auth/login");
    ipv6A1.setContextPath("/api");
    ipv6A1.setRemoteAddr("10.0.0.1");
    ipv6A1.addHeader("X-BFF-Auth", "valid-bff-secret");
    ipv6A1.addHeader("X-Client-IP", "2001:db8::1");
    MockHttpServletResponse resA1 = new MockHttpServletResponse();
    filter.doFilter(ipv6A1, resA1, new MockFilterChain());
    assertEquals(200, resA1.getStatus());

    MockHttpServletRequest ipv6B = new MockHttpServletRequest("POST", "/api/auth/login");
    ipv6B.setContextPath("/api");
    ipv6B.setRemoteAddr("10.0.0.1");
    ipv6B.addHeader("X-BFF-Auth", "valid-bff-secret");
    ipv6B.addHeader("X-Client-IP", "2001:db8::2");
    MockHttpServletResponse resB = new MockHttpServletResponse();
    filter.doFilter(ipv6B, resB, new MockFilterChain());
    assertEquals(200, resB.getStatus());

    // Malformed X-Client-IP and missing X-Client-IP both fall back to remoteAddr 10.0.0.99
    MockHttpServletRequest badHeader = new MockHttpServletRequest("POST", "/api/auth/login");
    badHeader.setContextPath("/api");
    badHeader.setRemoteAddr("10.0.0.99");
    badHeader.addHeader("X-BFF-Auth", "valid-bff-secret");
    badHeader.addHeader("X-Client-IP", "bad ip\ninjection");
    MockHttpServletResponse badRes = new MockHttpServletResponse();
    filter.doFilter(badHeader, badRes, new MockFilterChain());
    assertEquals(200, badRes.getStatus());

    MockHttpServletRequest missingHeader = new MockHttpServletRequest("POST", "/api/auth/login");
    missingHeader.setContextPath("/api");
    missingHeader.setRemoteAddr("10.0.0.99");
    missingHeader.addHeader("X-BFF-Auth", "valid-bff-secret");
    MockHttpServletResponse missingRes = new MockHttpServletResponse();
    filter.doFilter(missingHeader, missingRes, new MockFilterChain());
    assertEquals(429, missingRes.getStatus());
  }

  @Test
  @DisplayName("POST /auth/change-password is rate-limited in its own isolated bucket")
  void changePasswordIsRateLimitedWithoutExhaustingLogin() throws Exception {
    String ip = "198.51.100.90";
    String changeBody = "{\"currentPassword\":\"old123\",\"newPassword\":\"new456\"}";

    for (int i = 0; i < 2; i++) {
      mockMvc
          .perform(
              post("/auth/change-password")
                  .with(fromIp(ip))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(changeBody))
          .andExpect(status().isUnauthorized());
    }

    mockMvc
        .perform(
            post("/auth/change-password")
                .with(fromIp(ip))
                .contentType(MediaType.APPLICATION_JSON)
                .content(changeBody))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.status").value(429));

    // Login bucket for the same IP remains unaffected
    mockMvc
        .perform(
            post("/auth/login")
                .with(fromIp(ip))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@example.com\",\"password\":\"wrongpass\"}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Unauthenticated GET /auth/check-email is rejected with 401")
  void unauthenticatedCheckEmailReturns401() throws Exception {
    mockMvc
        .perform(
            get("/auth/check-email")
                .param("email", "any@example.com")
                .with(fromIp("198.51.100.91")))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  @WithMockUser(username = "patient@example.com", roles = "PATIENT")
  @DisplayName("PATIENT calling GET /auth/check-email is rejected with 403")
  void patientCheckEmailReturns403() throws Exception {
    mockMvc
        .perform(
            get("/auth/check-email")
                .param("email", "any@example.com")
                .with(fromIp("198.51.100.92")))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));
  }

  @Test
  @WithMockUser(username = "dentist@example.com", roles = "DENTIST")
  @DisplayName("DENTIST calling GET /auth/check-email is rejected with 403")
  void dentistCheckEmailReturns403() throws Exception {
    mockMvc
        .perform(
            get("/auth/check-email")
                .param("email", "any@example.com")
                .with(fromIp("198.51.100.93")))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));
  }

  @Test
  @DisplayName("Prod profile uses native Tomcat forwarded-header strategy instead of framework")
  void prodProfileUsesNativeForwardHeadersStrategy() throws Exception {
    Properties props = new Properties();
    try (InputStream in =
        getClass().getClassLoader().getResourceAsStream("application-prod.properties")) {
      assertTrue(in != null, "application-prod.properties must exist on classpath");
      props.load(in);
    }
    assertEquals("native", props.getProperty("server.forward-headers-strategy"));
  }
}
