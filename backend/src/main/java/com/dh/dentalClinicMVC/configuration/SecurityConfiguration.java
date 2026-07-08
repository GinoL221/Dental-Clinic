package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.security.StalePrincipalEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfiguration {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final AuthenticationProvider authenticationProvider;
  private final StalePrincipalEntryPoint stalePrincipalEntryPoint;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
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
        // frontend/src/controllers/auth/postLogin.js), which blocks the
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
        // catch) and the pre-existing malformed/expired/absent-token path. Deliberately does
        // NOT touch accessDeniedHandler: authenticated-but-forbidden (wrong role /
        // @PreAuthorize deny) stays 403 via the default handler, unaffected. See design.md
        // Decision 3.
        .exceptionHandling(handling -> handling.authenticationEntryPoint(stalePrincipalEntryPoint))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/auth/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/swagger-ui/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/v3/api-docs/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/swagger-ui.html")
                    .permitAll()
                    .requestMatchers("/h2-console/**")
                    .authenticated()
                    .requestMatchers(
                        "/",
                        "/index.html",
                        "/login.html",
                        "/register.html",
                        "/dentistList.html",
                        "dentistAdd.html")
                    .permitAll()
                    .requestMatchers("/js/**", "/css/**", "/images/**")
                    .permitAll()
                    .requestMatchers("/admin/**")
                    .hasRole("ADMIN")
                    .anyRequest()
                    .authenticated())
        .authenticationProvider(authenticationProvider)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .cors(cors -> {})
        .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
    ;

    return http.build();
  }
}
