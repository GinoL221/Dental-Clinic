package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

  @Test
  void cookieOnlyAuthenticatesRequestWhenNoHeaderPresent() throws Exception {
    String token = "cookie-token";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie("authToken", token));

    when(jwtService.extractUsername(token)).thenReturn(USER_EMAIL);
    when(userDetailsService.loadUserByUsername(USER_EMAIL)).thenReturn(userDetails);
    when(jwtService.isTokenValid(token, userDetails)).thenReturn(true);
    when(userDetails.getAuthorities()).thenReturn(Collections.emptyList());

    filter.doFilterInternal(request, response, filterChain);

    assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain).doFilter(request, response);
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
  void expiredOrInvalidCookieTokenIsRejected() throws Exception {
    String token = "invalid-cookie-token";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie("authToken", token));

    when(jwtService.extractUsername(token)).thenReturn(USER_EMAIL);
    when(userDetailsService.loadUserByUsername(USER_EMAIL)).thenReturn(userDetails);
    when(jwtService.isTokenValid(token, userDetails)).thenReturn(false);

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain).doFilter(request, response);
  }

  @Test
  void bothHeaderAndCookiePresentHeaderWinsWithNoConflict() throws Exception {
    String headerToken = "header-token";
    String cookieToken = "cookie-token";
    String headerUserEmail = "header-user@dentalclinic.com";
    String cookieUserEmail = "cookie-user@dentalclinic.com";
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer " + headerToken);
    request.setCookies(new Cookie("authToken", cookieToken));

    UserDetails headerUserDetails = org.mockito.Mockito.mock(UserDetails.class);
    // Stubbed but must never be consulted: proves the cookie's distinct
    // identity never leaks into the SecurityContext when the header wins.
    lenient().when(jwtService.extractUsername(cookieToken)).thenReturn(cookieUserEmail);

    when(jwtService.extractUsername(headerToken)).thenReturn(headerUserEmail);
    when(userDetailsService.loadUserByUsername(headerUserEmail)).thenReturn(headerUserDetails);
    when(jwtService.isTokenValid(headerToken, headerUserDetails)).thenReturn(true);
    when(headerUserDetails.getAuthorities()).thenReturn(Collections.emptyList());

    filter.doFilterInternal(request, response, filterChain);

    assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    assertEquals(
        headerUserDetails, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    verify(jwtService, never()).extractUsername(cookieToken);
    verify(userDetailsService, never()).loadUserByUsername(cookieUserEmail);
    verify(filterChain).doFilter(request, response);
  }

  @Test
  void malformedCookieTokenLeavesRequestUnauthenticatedWithoutThrowing() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie("authToken", "not-a-real-jwt"));
    when(jwtService.extractUsername("not-a-real-jwt"))
        .thenThrow(new MalformedJwtException("malformed token"));

    assertDoesNotThrow(() -> filter.doFilterInternal(request, response, filterChain));

    assertNull(SecurityContextHolder.getContext().getAuthentication());
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

  @Test
  void duplicateAuthTokenCookiesAreTreatedAsAmbiguousAndIgnored() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(
        new Cookie("authToken", "first-cookie-token"),
        new Cookie("authToken", "second-cookie-token"));

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(jwtService, never()).extractUsername(anyString());
    verify(filterChain).doFilter(request, response);
  }

  @Test
  void emptyAuthTokenCookieIsTreatedAsNoTokenPresent() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie("authToken", ""));

    filter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(jwtService, never()).extractUsername(anyString());
    verify(filterChain).doFilter(request, response);
  }
}
