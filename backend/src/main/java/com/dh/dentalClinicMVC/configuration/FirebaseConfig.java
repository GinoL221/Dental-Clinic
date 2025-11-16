package com.dh.dentalClinicMVC.configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Configuración de Firebase Admin.
 * Responsabilidades:
 * - Cargar credenciales del Service Account.
 * - Inicializar FirebaseApp una única vez.
 * - Exponer el bean Firestore para el resto de la aplicación.
 * <p>
 * Fuente de credenciales:
 * - Variable de entorno FIREBASE_SERVICE_ACCOUNT (path absoluto).
 * - Fallback: recurso en classpath `config/firebase-service-account.json`.
 * <p>
 * Seguridad:
 * - No subir el JSON al control de versiones.
 * - En producción usar secretos/variables de entorno.
 */
@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    /**
     * Path al archivo JSON del Service Account.
     * Inyecta el valor de la variable de entorno FIREBASE_SERVICE_ACCOUNT.
     * Si no existe, queda cadena vacía y se usa el recurso en classpath.
     */
    @Value("${FIREBASE_SERVICE_ACCOUNT:}")
    private String serviceAccountPath;

    /**
     * Inicializa Firebase al arrancar el contexto de Spring.
     * Pasos:
     * 1. Determina la fuente del JSON (path externo o classpath).
     * 2. Construye FirebaseOptions con las credenciales.
     * 3. Inicializa FirebaseApp solo si aún no existe.
     *
     * @throws Exception si falla la lectura del archivo o credenciales inválidas.
     */
    @PostConstruct
    public void init() throws Exception {
        InputStream serviceAccount;
        if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            // Caso: se proporcionó un path externo por variable de entorno
            serviceAccount = new FileInputStream(serviceAccountPath);
        } else {
            // Fallback: usar archivo empaquetado en el classpath si existe
            ClassPathResource resource = new ClassPathResource("config/firebase-service-account.json");
            if (resource.exists()) {
                serviceAccount = resource.getInputStream();
            } else {
                // No hay credenciales; no inicializamos Firebase
                log.warn("Firebase service account not found (env var or classpath). Firebase will remain disabled.");
                return;
            }
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        // Evita inicializaciones duplicadas si hay reinicios
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
            log.info("FirebaseApp initialized successfully");
        }
    }

    /**
     * Bean de Firestore para inyectar en servicios/repositorios.
     *
     * @return instancia reutilizable de Firestore.
     */
    @Bean
    public Firestore firestore() {
        // Si Firebase no fue inicializado (por ejemplo en tests), devolver instancia solo si existe
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Requesting Firestore bean but FirebaseApp is not initialized. Returning null will cause injection failures.");
            // Es preferible no registrar el bean si Firebase no está activo; lanzar excepción clara
            throw new IllegalStateException("Firestore bean requested but Firebase is not initialized");
        }
        return FirestoreClient.getFirestore();
    }
}
