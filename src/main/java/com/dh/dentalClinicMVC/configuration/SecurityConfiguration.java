package com.dh.dentalClinicMVC.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter; // Filtro personalizado para manejar la autenticación JWT
    private final AuthenticationProvider authenticationProvider; // Proveedor de autenticación configurado

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable() // Desactiva la protección CSRF (Cross-Site Request Forgery)
                .authorizeHttpRequests()
                .requestMatchers("/auth/**").permitAll() // Permite el acceso sin autenticación a ciertas rutas
                .anyRequest().authenticated() // Requiere autenticación para cualquier otra solicitud
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Configura la sesión como stateless (sin estado)
                .and()
                .authenticationProvider(authenticationProvider) // Configura el proveedor de autenticación
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Agrega el filtro JWT antes del filtro de autenticación predeterminado

        return http.build(); // Construye y devuelve la configuración de seguridad
    }
}