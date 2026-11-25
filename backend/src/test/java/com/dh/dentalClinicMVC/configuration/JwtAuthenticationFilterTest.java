package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.dh.dentalClinicMVC.entity.User;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import java.util.Collections;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

  private static final String USER_EMAIL = "patient@dentalclinic.com";

  @Mock private JwtService jwtService;

  @Mock private UserDetailsService userDetailsService;

  @Mock private FilterChain filterChain;

  @Mock private UserDetails userDetails;

  private JwtAuthenticationFilter filter;
  private MockHttpServletResponse response;

  @BeforeEach
  void setUp() {
    filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
    response = new MockHttpServletResponse();
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void bearerOnlyAuthenticatesRequest() throws Exception {
    // Regression guard: header-only auth must keep working unchanged.
    String token = "header-token";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer " + token);

    when(jwtService.extractUsername(token)).thenReturn(USER_EMAIL);
    when(userDetailsService.loadUserByUsername(USER_EMAIL)).thenReturn(userDetails);
    when(jwtService.isTokenValid(token, userDetails)).thenReturn(true);
    when(userDetails.getAuthorities()).thenReturn(Collections.emptyList());

    filter.doFilterInternal(request, response, filterChain);

    assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain).doFilter(request, response);
  }

  // T2 (auth-security-hardening S2): the backend is header-only. A request carrying
  // ONLY the SvelteKit session's authToken cookie must be treated as having NO token:
  // SecurityContext stays empty, the chain continues, and the JWT is never even parsed.
  @Test
  void cookieOnlyRequestIsLeftUnauthenticated() throws Exception {
    String token = "cookie-token";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie("authToken", token));

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain).doFilter(request, response);
    verify(jwtService, never()).extractUsername(anyString());
  }

  @Test
  void neitherHeaderNorCookieLeavesRequestUnauthenticated() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain).doFilter(request, response);
    verify(jwtService, never()).extractUsername(anyString());
  }

  @Test
  void malformedHeaderTokenLeavesRequestUnauthenticatedWithoutThrowing() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer not-a-real-jwt");
    when(jwtService.extractUsername("not-a-real-jwt"))
        .thenThrow(new MalformedJwtException("malformed token"));

    assertDoesNotThrow(() -> filter.doFilterInternal(request, response, filterChain));

    assertNull(SecurityContextHolder.getContext().getAuthentication());
  }

  // Phase 4 (authz-cleanup-round-2, R3 wiring): valid, unexpired JWT whose `users` row no
  // longer exists ("stale principal"). Must be caught exactly like the sibling
  // JwtException|IllegalArgumentException catch below: log, do NOT write a response, do NOT
  // short-circuit, fall through to filterChain.doFilter unauthenticated. See design.md
  // Decision 3 — the filter fails open; the custom StalePrincipalEntryPoint (wired in
  // SecurityConfiguration) is the one that produces the 401, not this filter.
  @Test
  void deadUsersRowJwtViaHeaderIsCaughtAndChainContinuesUnauthenticated() throws Exception {
    String token = "header-token-for-deleted-user";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer " + token);

    when(jwtService.extractUsername(token)).thenReturn(USER_EMAIL);
    when(userDetailsService.loadUserByUsername(USER_EMAIL))
        .thenThrow(new UsernameNotFoundException("No se encontró el usuario"));

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    assertEquals(200, response.getStatus(), "Filter must not write a response of its own");
    assertEquals(
        "", response.getContentAsString(), "Filter must not write a response body of its own");
    verify(filterChain).doFilter(request, response);
  }

  // appointment-role-null-hardening, Phase 3: valid, unexpired JWT whose `users` row DOES
  // exist but whose `role` column is null. Must be caught exactly like the sibling
  // UsernameNotFoundException catch above: log, do NOT write a response, do NOT short-circuit,
  // fall through to filterChain.doFilter unauthenticated. Without the guard, getAuthorities()
  // (User.java:44-46) would NPE on role.name() at isTokenValid/getAuthorities time. See
  // design.md A6, Claim B.
  @Test
  void nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated() throws Exception {
    String token = "header-token-for-null-role-user";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer " + token);

    User nullRoleUser = new User();
    nullRoleUser.setEmail(USER_EMAIL);
    nullRoleUser.setRole(null);

    when(jwtService.extractUsername(token)).thenReturn(USER_EMAIL);
    when(userDetailsService.loadUserByUsername(USER_EMAIL)).thenReturn(nullRoleUser);

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    assertEquals(200, response.getStatus(), "Filter must not write a response of its own");
    assertEquals(
        "", response.getContentAsString(), "Filter must not write a response body of its own");
    verify(filterChain).doFilter(request, response);
    verify(jwtService, never()).isTokenValid(anyString(), org.mockito.ArgumentMatchers.any());
  }
}
