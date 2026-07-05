package com.dh.dentalClinicMVC.exception;

import com.dh.dentalClinicMVC.entity.AppointmentStatus;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(AppointmentStatus from, AppointmentStatus to) {
        super("Transición de estado inválida: no se puede pasar de " + from + " a " + to);
    }
}
