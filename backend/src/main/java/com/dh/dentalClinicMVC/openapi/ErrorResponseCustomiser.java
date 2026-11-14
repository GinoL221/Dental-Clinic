package com.dh.dentalClinicMVC.openapi;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MapSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the shared error body in the OpenAPI document and adds it to every operation for the
 * codes any endpoint can produce (400/401/403/500). Endpoint-specific codes (404 resource lookups,
 * 409 duplicates/conflicts) are declared per endpoint with @ApiResponse.
 */
@Configuration
public class ErrorResponseCustomiser {

  @Bean
  public OpenApiCustomizer globalErrorResponseCustomiser() {
    return openApi -> {
      registerErrorSchema(openApi);
      openApi.getPaths().values().stream()
          .flatMap(pathItem -> pathItem.readOperations().stream())
          .forEach(operation -> addCommonErrorResponses(operation.getResponses()));
    };
  }

  private void registerErrorSchema(OpenAPI openApi) {
    Components components = openApi.getComponents();
    if (components == null) {
      components = new Components();
      openApi.setComponents(components);
    }
    io.swagger.v3.oas.models.media.Schema schema =
        new ObjectSchema()
            .description("Cuerpo estándar de todas las respuestas de error de la API")
            .addProperty("error", new StringSchema().description("Categoría del error"))
            .addProperty("message", new StringSchema().description("Mensaje legible"))
            .addProperty("path", new StringSchema().description("Ruta solicitada"))
            .addProperty("status", new IntegerSchema().description("Código HTTP"))
            .addProperty(
                "timestamp",
                new StringSchema().format("date-time").description("Momento del error"))
            .addProperty(
                "fieldErrors",
                new MapSchema()
                    .additionalProperties(new StringSchema())
                    .description("Errores por campo; solo en respuestas de validación (400)"));
    components.addSchemas(ErrorResponse.class.getSimpleName(), schema);
  }

  private void addCommonErrorResponses(ApiResponses responses) {
    addError(responses, "400", "Solicitud inválida (validación o argumentos)");
    addError(responses, "401", "No autenticado o sesión inválida");
    addError(responses, "403", "Acceso denegado para el rol autenticado");
    addError(responses, "500", "Error interno del servidor");
  }

  private void addError(ApiResponses responses, String code, String description) {
    if (responses.containsKey(code)) {
      return;
    }
    MediaType json =
        new MediaType()
            .schema(
                new io.swagger.v3.oas.models.media.Schema()
                    .$ref("#/components/schemas/" + ErrorResponse.class.getSimpleName()));
    responses.addApiResponse(
        code,
        new ApiResponse()
            .description(description)
            .content(new Content().addMediaType("application/json", json)));
  }
}
