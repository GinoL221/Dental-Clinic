package com.dh.dentalClinicMVC.migration;

import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.WriteBatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Runner de migración de datos a Firestore.
 * <p>
 * - Se ejecuta al iniciar la aplicación (Spring Boot).
 * - Solo corre si la variable de entorno {@code FIREBASE_MIGRATE=true}.
 * - Migra entidades de JPA a colecciones en Firestore usando lotes (batch) seguros.
 */
@Component
public class FirebaseMigrationRunner implements CommandLineRunner {

    /**
     * Repositorio de odontólogos.
     */
    @Autowired
    private IDentistRepository dentistRepository;

    /**
     * Repositorio de pacientes.
     */
    @Autowired
    private IPatientRepository patientRepository;

    /**
     * Repositorio de turnos.
     */
    @Autowired
    private IAppointmentRepository appointmentRepository;

    /**
     * Mapper para convertir entidades en {@code Map<String, Object>}.
     */
    private final ObjectMapper mapper = new ObjectMapper().disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

    /**
     * Bean Firestore provisto por FirebaseConfig
     */
    @Autowired
    private Firestore firestore;

    /**
     * Punto de entrada del runner.
     * - Verifica la variable de entorno para habilitar la migración.
     * - Obtiene el cliente de Firestore.
     * - Invoca la migración por cada colección de destino.
     *
     * @param args argumentos de la línea de comandos (no utilizados).
     * @throws Exception si falla alguna operación de Firestore.
     */
    @Override
    public void run(String... args) throws Exception {
        // Protección: solo corre si FIREBASE_MIGRATE=true
        if (!"true".equalsIgnoreCase(System.getenv("FIREBASE_MIGRATE"))) {
            return;
        }

        // Usar el bean Firestore inyectado (FirebaseConfig crea este bean)
        Firestore db = this.firestore;

        System.out.println("[MIGRATION] Iniciando migración a Firestore...");

        // Migra cada entidad a su colección homónima en Firestore
        migrateCollection(db, "dentists", dentistRepository.findAll());
        migrateCollection(db, "patients", patientRepository.findAll());
        migrateCollection(db, "appointments", appointmentRepository.findAll());

        System.out.println("[MIGRATION] Migración finalizada.");
    }

    /**
     * Migra un conjunto de entidades a una colección de Firestore usando lotes.
     * - Convierte cada entidad a {@code Map<String, Object>}.
     * - Determina el ID de documento (si existe) o deja que Firestore lo genere.
     * - Hace upsert con {@code SetOptions.merge()} para no sobrescribir campos inexistentes.
     * - Confirma el batch cada ~400 documentos (límite seguro).
     *
     * @param db         instancia de Firestore.
     * @param collection nombre de la colección destino.
     * @param items      entidades a migrar (Iterable).
     * @param <T>        tipo de la entidad.
     * @throws Exception si falla el commit del batch.
     */
    private <T> void migrateCollection(Firestore db, String collection, Iterable<T> items) throws Exception {
        int batchCount = 0;
        int total = 0;

        WriteBatch batch = db.batch();
        for (T entity : items) {
            total++;

            // 1) Resolver ID de la entidad (por @Id o getId())
            String id = extractEntityId(entity);

            // 2) Convertir entidad a Map para Firestore
            Map<String, Object> data = mapper.convertValue(entity, new TypeReference<>() {
            });

            // Sanitizar/normalizar el mapa antes de enviarlo a Firestore
            sanitizeData(data);

            // 3) Resolver referencia a documento (con ID propio o autogenerado)
            DocumentReference docRef = (id != null && !id.isBlank()) ? db.collection(collection).document(id) : db.collection(collection).document();

            // 4) Acumular operación en el batch con merge (upsert)
            batch.set(docRef, data, SetOptions.merge());
            batchCount++;

            // 5) Confirmar batch periódicamente para no exceder límites
            if (batchCount >= 400) {
                commitBatch(batch);
                batch = db.batch();
                batchCount = 0;
            }
        }

        // 6) Confirmar remanente
        if (batchCount > 0) {
            commitBatch(batch);
        }

        System.out.printf("[MIGRATION] Colección '%s' -> %d documentos migrados.%n", collection, total);
    }

    /**
     * Confirma un batch y espera a que Firestore termine.
     *
     * @param batch lote de escrituras pendiente.
     * @throws Exception si falla el commit.
     */
    private void commitBatch(WriteBatch batch) throws Exception {
        ApiFuture<java.util.List<com.google.cloud.firestore.WriteResult>> future = batch.commit();
        future.get(); // Espera bloqueante hasta finalizar
    }

    /**
     * Extrae el ID de una entidad de forma flexible:
     * - Busca un campo con anotación \`@Id\` (jakarta o javax) y retorna su valor.
     * - Si no encuentra, intenta invocar \`getId()\`.
     * - Si no existe ID, retorna \`null\` para que Firestore lo autogenere.
     *
     * @param entity entidad origen.
     * @return ID como \`String\` o \`null\`.
     */
    private String extractEntityId(Object entity) {
        if (entity == null) return null;

        // 1) Buscar campo anotado con @Id en la jerarquía de clases (incluye superclases)
        Class<?> current = entity.getClass();
        while (current != null && current != Object.class) {
            for (Field f : current.getDeclaredFields()) {
                if (hasIdAnnotation(f)) {
                    try {
                        f.setAccessible(true);
                        Object value = f.get(entity);
                        return value != null ? String.valueOf(value) : null;
                    } catch (Exception ignored) {
                        // Ignorar y continuar buscando
                    }
                }
            }
            current = current.getSuperclass();
        }

        // 2) Método getId()
        try {
            Method m = entity.getClass().getMethod("getId");
            Object value = m.invoke(entity);
            if (value != null) return String.valueOf(value);
        } catch (Exception ignored) {
            // No hay getId o falló la invocación
        }

        // 3) Sin ID: dejar que Firestore genere uno
        return null;
    }

    /**
     * Verifica si el campo tiene la anotación \`@Id\` (jakarta o javax).
     *
     * @param f campo a inspeccionar.
     * @return \`true\` si el campo está anotado, en caso contrario \`false\`.
     */
    private boolean hasIdAnnotation(Field f) {
        return isAnnotationPresent(f, "jakarta.persistence.Id") || isAnnotationPresent(f, "javax.persistence.Id");
    }

    /**
     * Verifica si una anotación está presente sin depender en tiempo de compilación
     * del paquete (se carga por nombre para soportar jakarta/javax).
     *
     * @param f                   campo a inspeccionar.
     * @param annotationClassName nombre FQN de la anotación.
     * @return \`true\` si el campo tiene la anotación, si no existe la clase de anotación o no está presente, \`false\`.
     */
    private boolean isAnnotationPresent(Field f, String annotationClassName) {
        try {
            Class<?> ann = Class.forName(annotationClassName);
            @SuppressWarnings("unchecked")
            Class<? extends java.lang.annotation.Annotation> annClass = (Class<? extends java.lang.annotation.Annotation>) ann;
            return f.isAnnotationPresent(annClass);
        } catch (ClassNotFoundException e) {
            // No está en el classpath (por ejemplo, solo se usa la otra variante)
            return false;
        }
    }

    /**
     * Sanitiza el mapa resultante de la entidad para evitar subir datos sensibles
     * o estructuras problemáticas a Firestore.
     * - Elimina la clave "password" si existe.
     * - Elimina colecciones (por ejemplo "appointments") para no subir grandes relaciones.
     * - Convierte LocalDate/LocalTime a String ISO (toString()).
     * - Recursivamente limpia mapas anidados.
     * - Elimina campos que sean colecciones (por simplicidad).
     *
     * @param data mapa mutable a sanitizar
     */
    @SuppressWarnings("unchecked")
    private void sanitizeData(Map<String, Object> data) {
        if (data == null) return;

        // Eliminar contraseñas y colecciones/relaciones no deseadas
        data.remove("password");
        data.remove("appointments");
        data.remove("roles");
        data.remove("role");
        data.remove("class");

        // Iterar sobre una copia de las entradas para poder modificar el mapa
        List<Map.Entry<String, Object>> entries = new ArrayList<>(data.entrySet());
        for (Map.Entry<String, Object> e : entries) {
            Object v = e.getValue();
            if (v == null) continue;

            // Recursividad para mapas anidados
            if (v instanceof Map) {
                sanitizeData((Map<String, Object>) v);
                continue;
            }

            // Convertir fechas/horas a String (ISO)
            if (v instanceof java.time.LocalDate || v instanceof java.time.LocalTime
                    || v instanceof java.time.LocalDateTime) {
                data.put(e.getKey(), v.toString());
                continue;
            }

            // Eliminar colecciones completas para evitar estructuras complejas
            if (v instanceof Collection) {
                data.remove(e.getKey());
            }
        }
    }
}
