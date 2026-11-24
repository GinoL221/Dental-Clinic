package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.security.AuthRateLimitFilter;
import com.dh.dentalClinicMVC.security.RestAccessDeniedHandler;
import com.dh.dentalClinicMVC.security.StalePrincipalEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfiguration {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final AuthenticationProvider authenticationProvider;
  private final StalePrincipalEntryPoint stalePrincipalEntryPoint;
  private final RestAccessDeniedHandler restAccessDeniedHandler;
  private final Environment environment;
  private final ObjectMapper objectMapper;

  @Value("${app.rate-limit.auth.enabled:true}")
  private boolean authRateLimitEnabled;

  @Value("${app.rate-limit.auth.max-requests:20}")
  private int authRateLimitMaxRequests;

  @Value("${app.rate-limit.auth.window-seconds:60}")
  private long authRateLimitWindowSeconds;

  @Value("${app.rate-limit.bff-shared-secret:}")
  private String authRateLimitBffSharedSecret;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    AuthRateLimitFilter authRateLimitFilter =
        new AuthRateLimitFilter(
            objectMapper,
            authRateLimitEnabled,
            authRateLimitMaxRequests,
            authRateLimitWindowSeconds,
            authRateLimitBffSharedSecret);
    http
        // CSRF is disabled here. Spring's default CSRF token repository
        // also requires session storage, which doesn't exist under
        // STATELESS below anyway — so a session-based CSRF token
        // mechanism could not be wired in as-is regardless.
        //
        // Auth model (current): JwtAuthenticationFilter checks the
        // Authorization header FIRST, then falls back to the httpOnly
        // authToken cookie. The cookie IS a browser-auto-attached
        // credential, so it is a CSRF target in principle. Today this
        // is mitigated by the cookie's SameSite=lax attribute (set in
        // frontend/src/routes/login/+page.server.js), which blocks the
        // cookie from being sent on cross-site script-initiated requests
        // (fetch/XHR) and on cross-site POST navigations in modern
        // browsers.
        //
        // INTERIM, NOT PERMANENT: SameSite=lax is not a substitute for a
        // real CSRF-token mechanism — it is a browser-enforced mitigation
        // that this app currently relies on while the Authorization
        // header fallback still exists. A future PR
        // (frontend-xss-token-hardening PR3) removes that header
        // fallback and makes the cookie the SOLE authentication
        // credential; at that point, relying on SameSite alone must be
        // re-evaluated and a real CSRF-token mechanism designed before
        // shipping, not after.
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Custom entry point replaces Spring's default Http403ForbiddenEntryPoint for any
        // unauthenticated request reaching a protected (authenticated()) route — including
        // the stale-principal path (see JwtAuthenticationFilter's UsernameNotFoundException
        // catch) and the pre-existing malformed/expired/absent-token path.
        //
        // Access denied: RestAccessDeniedHandler now writes the same ErrorResponse JSON
        // contract as GlobalExceptionHandler for URL-level denies (authorizeHttpRequests,
        // e.g. an authenticated DENTIST hitting /admin/**). Method-level denies
        // (@PreAuthorize) still surface as AccessDeniedException inside the
        // DispatcherServlet and keep being mapped by GlobalExceptionHandler with the same
        // body shape. This supersedes the earlier decision of leaving Spring's default
        // access-denied handler untouched (archived openspec design decision); the live
        // contract is documented in docs/api-errors.md.
        .exceptionHandling(
            handling ->
                handling
                    .authenticationEntryPoint(stalePrincipalEntryPoint)
                    .accessDeniedHandler(restAccessDeniedHandler))
        .authorizeHttpRequests(
            auth -> {
              auth.requestMatchers(HttpMethod.GET, "/auth/me")
                  .authenticated()
                  .requestMatchers(HttpMethod.POST, "/auth/change-password")
                  .authenticated()
                  .requestMatchers(HttpMethod.GET, "/auth/check-email")
                  .hasRole("ADMIN")
                  .requestMatchers(HttpMethod.HEAD, "/auth/check-email")
                  .hasRole("ADMIN")
                  .requestMatchers("/auth/**")
                  .permitAll()
                  .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**")
                  .permitAll()
                  .requestMatchers(HttpMethod.GET, "/swagger-ui/**")
                  .permitAll()
                  .requestMatchers(HttpMethod.GET, "/v3/api-docs/**")
                  .permitAll()
                  .requestMatchers(HttpMethod.GET, "/swagger-ui.html")
                  .permitAll();
              if (!environment.acceptsProfiles(Profiles.of("prod"))) {
                auth.requestMatchers("/h2-console/**").authenticated();
              }
              auth.requestMatchers("/admin/**").hasRole("ADMIN").anyRequest().authenticated();
            })
        .authenticationProvider(authenticationProvider)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(authRateLimitFilter, JwtAuthenticationFilter.class)
        .cors(cors -> {})
        .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

    return http.build();
  }
}
