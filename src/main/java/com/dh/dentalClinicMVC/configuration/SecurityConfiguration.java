package com.dh.dentalClinicMVC.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter; // Filtro personalizado para manejar la autenticación JWT.
    private final AuthenticationProvider authenticationProvider; // Proveedor de autenticación configurado para validar credenciales.

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Desactiva la protección contra CSRF, ya que la aplicación es stateless.
                .authorizeHttpRequests(
                        auth -> auth
                                .requestMatchers("/auth/**").permitAll() // Permite el acceso sin autenticación a las rutas relacionadas con autenticación.
                                .requestMatchers(HttpMethod.GET, "/swagger-ui/**").permitAll() // Permite el acceso sin autenticación a las rutas de Swagger UI.
                                .requestMatchers(HttpMethod.GET, "/v3/api-docs/**").permitAll() // Permite el acceso sin autenticación a las rutas de documentación de la API.
                                .requestMatchers(HttpMethod.GET, "/swagger-ui.html").permitAll() // Permite el acceso sin autenticación a la página principal de Swagger UI.
                                .anyRequest().authenticated() // Requiere autenticación para cualquier otra solicitud.
                )
                .sessionManagement(
                        session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Configura la sesión como stateless, ya que se utiliza JWT.
                .authenticationProvider(authenticationProvider) // Configura el proveedor de autenticación para validar usuarios.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Agrega el filtro JWT antes del filtro de autenticación predeterminado.

        return http.build(); // Construye y devuelve la configuración de la cadena de filtros de seguridad.
    }
}