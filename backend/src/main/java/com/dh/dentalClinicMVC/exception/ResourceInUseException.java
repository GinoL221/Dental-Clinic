package com.dh.dentalClinicMVC.exception;

public class ResourceInUseException extends RuntimeException {
  public ResourceInUseException(String message) {
    super(message);
  }
}
