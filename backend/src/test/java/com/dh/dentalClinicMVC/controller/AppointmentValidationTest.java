package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
public class AppointmentValidationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  public void createAppointmentWithPastDateShouldReturnBadRequest() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":5555,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v1dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":5555,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v1patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Fecha anterior
    String date = LocalDate.now().minusDays(1).toString();
    String time = LocalTime.now().plusHours(1).withSecond(0).withNano(0).toString();

    AppointmentRequestDTO appointmentRequest =
        new AppointmentRequestDTO(
            (long) dentistId,
            (long) patientId,
            date,
            time.substring(0, 5),
            "Past date appointment");
    String appointmentJson = objectMapper.writeValueAsString(appointmentRequest);

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(appointmentJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("La fecha no puede ser anterior a hoy"));
  }

  @Test
  public void createAppointmentWithPastTimeTodayShouldReturnBadRequest() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":5556,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v2dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":5556,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v2patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Fecha hoy y hora pasada
    LocalDate today = LocalDate.now();
    String date = today.toString();
    LocalTime now = LocalTime.now();
    LocalTime pastTime =
        now.getHour() >= 1
            ? now.minusHours(1).withSecond(0).withNano(0)
            : now.withSecond(0).withNano(0);
    String time = pastTime.toString();

    AppointmentRequestDTO appointmentRequest =
        new AppointmentRequestDTO(
            (long) dentistId,
            (long) patientId,
            date,
            time.substring(0, 5),
            "Past time today appointment");
    String appointmentJson = objectMapper.writeValueAsString(appointmentRequest);

    boolean isWeekend =
        today.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
            || today.getDayOfWeek() == java.time.DayOfWeek.SUNDAY;
    String expectedMessage =
        isWeekend
            ? "Solo se pueden programar citas de lunes a viernes"
            : "La hora seleccionada ya pasó";

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(appointmentJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value(expectedMessage));
  }

  @Test
  public void createAppointmentWithDescriptionBoundary500ShouldSucceed() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":6655,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v3dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":6655,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v3patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Generar descripción de exactamente 500 caracteres
    String description = "A".repeat(500);

    String date = LocalDate.now().plusDays(1).toString();
    String time = "10:00";

    AppointmentRequestDTO appointmentRequest =
        new AppointmentRequestDTO((long) dentistId, (long) patientId, date, time, description);
    String appointmentJson = objectMapper.writeValueAsString(appointmentRequest);

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(appointmentJson))
        .andExpect(status().isOk());
  }

  @Test
  public void createAppointmentWithDescriptionOverLength501ShouldReturnBadRequest()
      throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":6656,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v4dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":6656,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v4patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Generar descripción de 501 caracteres
    String description = "A".repeat(501);

    String date = LocalDate.now().plusDays(1).toString();
    String time = "10:00";

    AppointmentRequestDTO appointmentRequest =
        new AppointmentRequestDTO((long) dentistId, (long) patientId, date, time, description);
    String appointmentJson = objectMapper.writeValueAsString(appointmentRequest);

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(appointmentJson))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(
                    org.hamcrest.Matchers.containsString(
                        "La descripción no puede exceder 500 caracteres")));
  }

  @Test
  public void createAppointmentOutsideWorkingHoursShouldReturnBadRequest() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":7755,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v5dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":7755,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v5patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Buscar un día de semana futuro
    LocalDate weekday = LocalDate.now().plusDays(1);
    while (weekday.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
        || weekday.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
      weekday = weekday.plusDays(1);
    }
    String dateStr = weekday.toString();

    // Probar 07:59 -> 400
    AppointmentRequestDTO app0759 =
        new AppointmentRequestDTO(
            (long) dentistId, (long) patientId, dateStr, "07:59", "Outside working hours 07:59");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(app0759)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("La hora debe estar entre 08:00 y 18:00"));

    // Probar 18:01 -> 400
    AppointmentRequestDTO app1801 =
        new AppointmentRequestDTO(
            (long) dentistId, (long) patientId, dateStr, "18:01", "Outside working hours 18:01");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(app1801)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("La hora debe estar entre 08:00 y 18:00"));
  }

  @Test
  public void createAppointmentWithinWorkingHoursShouldSucceed() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":7756,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v6dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":7756,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v6patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Buscar un día de semana futuro
    LocalDate weekday = LocalDate.now().plusDays(1);
    while (weekday.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
        || weekday.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
      weekday = weekday.plusDays(1);
    }
    String dateStr = weekday.toString();

    // Probar 08:00 -> 200
    AppointmentRequestDTO app0800 =
        new AppointmentRequestDTO(
            (long) dentistId,
            (long) patientId,
            dateStr,
            "08:00",
            "Lower boundary working hours 08:00");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(app0800)))
        .andExpect(status().isOk());

    // Probar 18:00 -> 200
    AppointmentRequestDTO app1800 =
        new AppointmentRequestDTO(
            (long) dentistId,
            (long) patientId,
            dateStr,
            "18:00",
            "Upper boundary working hours 18:00");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(app1800)))
        .andExpect(status().isOk());
  }

  @Test
  public void createAppointmentOnWeekendShouldReturnBadRequest() throws Exception {
    // Crear dentista
    String dentistJson =
        "{\"registrationNumber\":7757,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v7dentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":7757,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v7patient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Buscar el próximo sábado
    LocalDate nextSaturday = LocalDate.now();
    while (nextSaturday.getDayOfWeek() != java.time.DayOfWeek.SATURDAY) {
      nextSaturday = nextSaturday.plusDays(1);
    }
    LocalDate nextSunday = nextSaturday.plusDays(1);

    // Probar Sábado -> 400
    AppointmentRequestDTO appSaturday =
        new AppointmentRequestDTO(
            (long) dentistId,
            (long) patientId,
            nextSaturday.toString(),
            "10:00",
            "Weekend Saturday");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appSaturday)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message").value("Solo se pueden programar citas de lunes a viernes"));

    // Probar Domingo -> 400
    AppointmentRequestDTO appSunday =
        new AppointmentRequestDTO(
            (long) dentistId, (long) patientId, nextSunday.toString(), "10:00", "Weekend Sunday");
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appSunday)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message").value("Solo se pueden programar citas de lunes a viernes"));
  }
}
