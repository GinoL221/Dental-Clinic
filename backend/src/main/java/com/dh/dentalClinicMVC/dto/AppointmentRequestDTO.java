package com.dh.dentalClinicMVC.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequestDTO {

    @NotNull(message = "El odontólogo es requerido")
    private Long dentistId;

    @NotNull(message = "El paciente es requerido")
    private Long patientId;

    @NotBlank(message = "La fecha es requerida")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Formato de fecha inválido (yyyy-MM-dd)")
    private String date;

    @NotBlank(message = "La hora es requerida")
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Formato de hora inválido (HH:mm)")
    private String time;

    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String description; // optional
}
