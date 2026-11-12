package com.dh.dentalClinicMVC.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
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

  // Additive: only validation responses populate it; serialized as null and omitted from JSON
  // so every other handler keeps the exact same body shape as before.
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Map<String, String> fieldErrors;

  public ErrorResponse(String error, String message) {
    this.error = error;
    this.message = message;
    this.timestamp = LocalDateTime.now();
  }
}
