package com.dh.dentalClinicMVC.entity;

public enum AppointmentStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(AppointmentStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case SCHEDULED -> true;
            case IN_PROGRESS -> target == COMPLETED || target == CANCELLED;
            case COMPLETED -> false;
            case CANCELLED -> false;
        };
    }
}
