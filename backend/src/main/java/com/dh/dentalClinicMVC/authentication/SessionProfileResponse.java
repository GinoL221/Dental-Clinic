package com.dh.dentalClinicMVC.authentication;

public record SessionProfileResponse(
    Long id, String firstName, String lastName, String email, String role) {}
