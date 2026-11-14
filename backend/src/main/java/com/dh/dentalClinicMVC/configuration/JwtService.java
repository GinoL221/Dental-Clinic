package com.dh.dentalClinicMVC.configuration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  @Value("${app.jwt.secret}")
  private String secretKey;

  // Extrae el nombre de usuario (subject) del token JWT
  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  // Genera un token JWT sin claims adicionales
  public String generateToken(UserDetails userDetails) {
    return generateToken(new HashMap<>(), userDetails);
  }

  // Genera un token JWT con claims adicionales y datos del usuario
  public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
    return Jwts.builder()
        .claims(extraClaims) // Establece los claims adicionales
        .subject(userDetails.getUsername()) // Establece el nombre de usuario como subject
        .issuedAt(new Date(System.currentTimeMillis())) // Fecha de emisión
        .expiration(
            new Date(
                System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // Fecha de expiración (10 horas)
        .signWith(getSignInKey(), Jwts.SIG.HS256) // Firma el token con la clave secreta
        .compact();
  }

  // Verifica si el token es válido comparando el nombre de usuario y verificando la expiración
  public boolean isTokenValid(String token, UserDetails userDetails) {
    final String username = extractUsername(token);
    return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
  }

  // Verifica si el token ha expirado
  private boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }

  // Extrae la fecha de expiración del token
  private Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  // Extrae un claim específico del token utilizando una función
  public <T> T extractClaim(String token, Function<Claims, T> claimsTFunction) {
    final Claims claims = extractAllClaims(token);
    return claimsTFunction.apply(claims);
  }

  // Extrae todos los claims del token
  public Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(getSignInKey()) // Configura la clave de firma
        .build()
        .parseSignedClaims(token) // Parsea el token JWT
        .getPayload(); // Obtiene el cuerpo del token (claims)
  }

  // Obtiene la clave de firma a partir de la clave secreta
  private SecretKey getSignInKey() {
    byte[] keyBytes = Decoders.BASE64.decode(secretKey); // Decodifica la clave secreta en Base64
    return Keys.hmacShaKeyFor(keyBytes); // Genera la clave HMAC
  }
}
