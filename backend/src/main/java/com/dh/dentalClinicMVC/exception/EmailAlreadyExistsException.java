package com.dh.dentalClinicMVC.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("El email ya existe: " + email);
    }
}
