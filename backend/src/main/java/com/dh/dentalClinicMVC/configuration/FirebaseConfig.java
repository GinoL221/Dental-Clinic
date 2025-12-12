package com.dh.dentalClinicMVC.configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Configuración de Firebase Admin.
 * - Prioriza la variable de entorno GOOGLE_APPLICATION_CREDENTIALS (ruta absoluta al JSON).
 * - Fallback a recurso en classpath `config/firebase-service-account.json`.
 * - Inicializa FirebaseApp una única vez y expone Bean `Firestore`.
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    /**
     * Valor inyectado por propiedad (opcional). Permite override desde application.properties
     * si se quisiera usar en lugar de la variable de entorno.
     */
    @Value("${firebase.credentials.path:}")
    private String serviceAccountPath;

    @PostConstruct
    public void init() throws Exception {
        InputStream serviceAccount = null;

        // 1. Priorizar la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
        String envPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (envPath != null && !envPath.isBlank()) {
            log.info("Using GOOGLE_APPLICATION_CREDENTIALS environment variable for Firebase credentials");
            serviceAccount = new FileInputStream(envPath);
        }

        // 2. Si no hay env var, usar la propiedad firebase.credentials.path (opcional)
        if (serviceAccount == null && serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            log.info("Using firebase.credentials.path from application properties for Firebase credentials");
            serviceAccount = new FileInputStream(serviceAccountPath);
        }

        // 3. Fallback: recurso en classpath
        if (serviceAccount == null) {
            ClassPathResource resource = new ClassPathResource("config/firebase-service-account.json");
            if (resource.exists()) {
                log.info("Using firebase-service-account.json from classpath");
                serviceAccount = resource.getInputStream();
            }
        }

        if (serviceAccount == null) {
            log.warn("Firebase service account not found. Set GOOGLE_APPLICATION_CREDENTIALS or firebase.credentials.path or add config/firebase-service-account.json to classpath.");
            return; // No inicializamos FirebaseApp
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
            log.info("FirebaseApp initialized successfully");
        } else {
            log.info("FirebaseApp already initialized; skipping initialization");
        }
    }

    /**
     * Bean de Firestore para inyectar en servicios/repositorios.
     * Lanzará IllegalStateException si Firebase no fue inicializado.
     */
    @Bean
    public Firestore firestore() {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firestore bean requested but FirebaseApp is not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or firebase.credentials.path and restart the application.");
        }
        return FirestoreClient.getFirestore();
    }
}
