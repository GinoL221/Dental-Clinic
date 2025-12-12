package com.dh.dentalClinicMVC.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Servicio simple que encapsula operaciones CRUD básicas sobre Firestore.
 * Notas:
 * - Las operaciones esperan el resultado (bloquean) usando .get() de ApiFuture para simplicidad.
 * - Para cargas grandes o alto rendimiento, reescribir con manejo asíncrono.
 */
@Service
public class FirestoreService {

    private static final Logger log = LoggerFactory.getLogger(FirestoreService.class);

    private final Firestore firestore;

    public FirestoreService(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Crea o actualiza un documento en la colección especificada. Si docId es null o vacío, genera uno nuevo.
     *
     * @param collection nombre de la colección
     * @param docId      id del documento (opcional)
     * @param data       mapa de campos a guardar
     * @return id del documento guardado
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public String createOrUpdateDocument(String collection, String docId, Map<String, Object> data) throws ExecutionException, InterruptedException {
        DocumentReference docRef = (docId == null || docId.isBlank())
                ? firestore.collection(collection).document()
                : firestore.collection(collection).document(docId);
        ApiFuture<WriteResult> writeResult = docRef.set(data);
        WriteResult result = writeResult.get();
        log.debug("Document saved: {} at {}", docRef.getId(), result.getUpdateTime());
        return docRef.getId();
    }

    /**
     * Obtiene un documento por colección e id.
     *
     * @param collection colección
     * @param docId      id del documento
     * @return mapa de campos o null si no existe
     */
    public Map<String, Object> getDocument(String collection, String docId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collection).document(docId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot snapshot = future.get();
        if (snapshot.exists()) {
            return snapshot.getData();
        }
        return null;
    }

    /**
     * Elimina un documento.
     */
    public void deleteDocument(String collection, String docId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collection).document(docId);
        ApiFuture<WriteResult> writeResult = docRef.delete();
        writeResult.get();
        log.debug("Document deleted: {}", docId);
    }
}

