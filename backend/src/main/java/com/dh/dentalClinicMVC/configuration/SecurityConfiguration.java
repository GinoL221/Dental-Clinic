package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.security.ActiveSessionAuthorizationManager;
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
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
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
        // CSRF is disabled. The API is stateless (STATELESS below) and
        // authenticates exclusively via the Authorization: Bearer header,
        // which browsers never attach automatically to cross-site requests
        // — so there is no browser-attached credential for a CSRF attack
        // to ride on. The httpOnly authToken cookie belongs to the
        // SvelteKit frontend session store and is never read by this
        // backend. Due diligence for the future: if the backend ever
        // accepts a browser-attached credential again (cookie auth or
        // similar), a CSRF-token mechanism must be designed and shipped
        // BEFORE re-enabling that credential path.
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
              AuthorizationManager<RequestAuthorizationContext> activeSessionManager =
                  new ActiveSessionAuthorizationManager();
              AuthorizationManager<RequestAuthorizationContext> adminActiveSessionManager =
                  (authentication, context) -> {
                    var active = activeSessionManager.authorize(authentication, context);
                    if (active == null || !active.isGranted()) {
                      return new AuthorizationDecision(false);
                    }
                    Authentication current = authentication.get();
                    boolean isAdmin =
                        current != null
                            && current.getAuthorities().stream()
                                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                    return new AuthorizationDecision(isAdmin);
                  };

              auth.requestMatchers(HttpMethod.GET, "/auth/me")
                  .authenticated()
                  .requestMatchers(HttpMethod.POST, "/auth/change-password")
                  .authenticated()
                  .requestMatchers(HttpMethod.POST, "/auth/logout")
                  .authenticated()
                  .requestMatchers(HttpMethod.GET, "/auth/check-email")
                  .access(adminActiveSessionManager)
                  .requestMatchers(HttpMethod.HEAD, "/auth/check-email")
                  .access(adminActiveSessionManager)
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
                auth.requestMatchers("/h2-console/**").access(adminActiveSessionManager);
              }
              auth.requestMatchers("/admin/**")
                  .access(adminActiveSessionManager)
                  .anyRequest()
                  .access(activeSessionManager);
            })
        .authenticationProvider(authenticationProvider)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(authRateLimitFilter, JwtAuthenticationFilter.class)
        .cors(cors -> {})
        .headers(
            headers -> {
              if (!environment.acceptsProfiles(Profiles.of("prod"))) {
                headers.frameOptions(frame -> frame.sameOrigin());
              } else {
                headers.frameOptions(frame -> frame.deny());
              }
            });

    return http.build();
  }
}
