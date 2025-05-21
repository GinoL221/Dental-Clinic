package com.dh.dentalClinicMVC.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService; // Servicio para manejar la lógica de los tokens JWT
    private final UserDetailsService userDetailsService; // Servicio para cargar los detalles del usuario

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

        // Verifica si el encabezado es nulo o no comienza con "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Continúa con el siguiente filtro si no hay token
            return;
        }

        // Extrae el token JWT del encabezado
        jwt = authHeader.substring(7);

        // Extrae el correo electrónico del usuario del token
        userEmail = jwtService.extractUsername(jwt);

        // Verifica si el correo electrónico no es nulo y no hay autenticación previa en el contexto de seguridad
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Carga los detalles del usuario desde el servicio
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Verifica si el token es válido
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // Crea un token de autenticación para el usuario
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities() // Establece las autoridades del usuario
                );

                // Asocia los detalles de la solicitud al token de autenticación
                authenticationToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Establece el token de autenticación en el contexto de seguridad
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }
        // Continúa con el siguiente filtro en la cadena
        filterChain.doFilter(request, response);
    }
}