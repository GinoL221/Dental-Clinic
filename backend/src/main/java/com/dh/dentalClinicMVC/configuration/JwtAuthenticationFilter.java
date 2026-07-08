package com.dh.dentalClinicMVC.configuration;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

  private static final String AUTH_COOKIE_NAME = "authToken";

  private final JwtService jwtService; // Servicio para manejar la lógica de los tokens JWT
  private final UserDetailsService
      userDetailsService; // Servicio para cargar los detalles del usuario

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    // Obtiene el encabezado de autorización de la solicitud
    final String authHeader = request.getHeader("Authorization");
    final String jwt;
    final String userEmail;

    // Header checked first (unchanged precedence); falls back to the
    // httpOnly authToken cookie only when the header is absent/non-Bearer.
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      jwt = authHeader.substring(7);
    } else {
      jwt = extractTokenFromCookie(request);
    }

    if (jwt == null) {
      filterChain.doFilter(request, response); // Continúa con el siguiente filtro si no hay token
      return;
    }

    try {
      // Extrae el correo electrónico del usuario del token
      userEmail = jwtService.extractUsername(jwt);

      // Verifica si el correo electrónico no es nulo y no hay autenticación previa en
      // el contexto de seguridad
      if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        // Carga los detalles del usuario desde el servicio
        UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

        // Verifica si el token es válido
        if (jwtService.isTokenValid(jwt, userDetails)) {
          // Crea un token de autenticación para el usuario
          UsernamePasswordAuthenticationToken authenticationToken =
              new UsernamePasswordAuthenticationToken(
                  userDetails,
                  null,
                  userDetails.getAuthorities() // Establece las autoridades del usuario
                  );

          // Asocia los detalles de la solicitud al token de autenticación
          authenticationToken.setDetails(
              new WebAuthenticationDetailsSource().buildDetails(request));

          // Establece el token de autenticación en el contexto de seguridad
          SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        }
      }
    } catch (UsernameNotFoundException ex) {
      // Valid, unexpired JWT whose `users` row no longer exists ("stale
      // principal"). Mirrors the sibling catch below exactly: log, do NOT
      // write a response, do NOT short-circuit — fall through to
      // filterChain.doFilter unauthenticated. The custom
      // StalePrincipalEntryPoint (wired in SecurityConfiguration) produces
      // the 401 for any authenticated() route the request still can't pass;
      // permitAll routes (e.g. POST /auth/login) proceed normally, which is
      // what avoids a lockout on the account-recovery path. See design.md
      // Decision 3 — the ORIGINAL approach of hard-writing a 401 here ran on
      // every request (including permitAll) and caused exactly that lockout.
      log.warn("Rejected request with stale principal (no backing user row): {}", ex.getMessage());
    } catch (JwtException | IllegalArgumentException ex) {
      // Malformed, expired, tampered, or otherwise unparsable token from
      // EITHER the header or the cookie. Filters run before
      // DispatcherServlet, so no @ControllerAdvice can catch this if it
      // escapes — fail closed (unauthenticated) instead of 500ing.
      // Never log the raw token value, it is a secret.
      log.warn("Rejected request with invalid token: {}", ex.getMessage());
    }
    // Continúa con el siguiente filtro en la cadena
    filterChain.doFilter(request, response);
  }

  // Busca el JWT en la cookie httpOnly "authToken" (fallback cuando no hay
  // encabezado Authorization). Fail-closed: si hay cero cookies con ese
  // nombre, o si el valor es una cadena vacía, se trata como "sin token".
  // Si hay DOS O MÁS cookies con el mismo nombre, el origen es ambiguo/no
  // confiable y se descarta por completo (no se usa "la primera que
  // aparezca"). Escaneo null-safe: getCookies() puede ser null.
  private String extractTokenFromCookie(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    String token = null;
    int matches = 0;
    for (Cookie cookie : cookies) {
      if (AUTH_COOKIE_NAME.equals(cookie.getName())) {
        matches++;
        token = cookie.getValue();
      }
    }
    if (matches != 1) {
      return null;
    }
    return (token == null || token.isEmpty()) ? null : token;
  }
}
