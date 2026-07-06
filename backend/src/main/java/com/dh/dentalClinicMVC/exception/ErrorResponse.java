package com.dh.dentalClinicMVC.exception;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
  private String error;
  private String message;
  private String path;
  private int status;
  private LocalDateTime timestamp;

  public ErrorResponse(String error, String message) {
    this.error = error;
    this.message = message;
    this.timestamp = LocalDateTime.now();
  }
}
