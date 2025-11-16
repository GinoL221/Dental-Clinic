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
public class FirebaseConfig {

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
            // Fallback: usar archivo empaquetado en el classpath
            serviceAccount = new ClassPathResource("config/firebase-service-account.json").getInputStream();
        }

        FirebaseOptions options = FirebaseOptions.builder().setCredentials(GoogleCredentials.fromStream(serviceAccount)).build();

        // Evita inicializaciones duplicadas si hay reinicios
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }

    /**
     * Bean de Firestore para inyectar en servicios/repositorios.
     *
     * @return instancia reutilizable de Firestore.
     */
    @Bean
    public Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}
