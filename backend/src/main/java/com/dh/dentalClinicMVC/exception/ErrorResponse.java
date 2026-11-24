package com.dh.dentalClinicMVC.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.*;
import org.jspecify.annotations.Nullable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
  private @Nullable String error;
  private @Nullable String message;
  private @Nullable String path;
  private int status;
  private @Nullable LocalDateTime timestamp;

  // Additive: only validation responses populate it; serialized as null and omitted from JSON
  // so every other handler keeps the exact same body shape as before.
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private @Nullable Map<String, String> fieldErrors;

  public ErrorResponse(String error, @Nullable String message) {
    this.error = error;
    this.message = message;
    this.timestamp = LocalDateTime.now();
  }
}
