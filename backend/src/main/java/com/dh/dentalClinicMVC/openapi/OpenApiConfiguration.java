package com.dh.dentalClinicMVC.openapi;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

@OpenAPIDefinition(
        info = @Info(
                title = "Dental Clinic - Open API Documentation",
                version = "1.0",
                description = "API documentation for the Dental Clinic application"
        ),
        security = {
                @SecurityRequirement(name = "bearerAuth"),
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT autehtication",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfiguration {
}
