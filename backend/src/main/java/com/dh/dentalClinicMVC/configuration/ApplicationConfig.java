package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final IUserRepository userRepository;

    // Define un servicio para cargar los detalles del usuario desde la base de datos
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username) // Busca el usuario por email
                .orElseThrow(() -> new UsernameNotFoundException("No se encontró el usuario")); // Lanza excepción si no existe
    }

    // Configura el proveedor de autenticación utilizando el servicio de usuarios y el codificador de contraseñas
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsService()); // Asocia el servicio de usuarios
        authenticationProvider.setPasswordEncoder(passwordEncoder()); // Asocia el codificador de contraseñas
        return authenticationProvider;
    }

    // Proporciona el gestor de autenticación configurado
    @Bean
    public AuthenticationManager authenticatedManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // Define un codificador de contraseñas utilizando BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}