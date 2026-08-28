package com.dh.dentalClinicMVC.configuration;

import static com.dh.dentalClinicMVC.entity.AppointmentStatus.CANCELLED;
import static com.dh.dentalClinicMVC.entity.AppointmentStatus.COMPLETED;
import static com.dh.dentalClinicMVC.entity.AppointmentStatus.IN_PROGRESS;
import static com.dh.dentalClinicMVC.entity.AppointmentStatus.SCHEDULED;

import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import java.util.List;

public final class DevAppointmentFixtures {
  public record AppointmentFixture(
      String patientKey,
      String dentistKey,
      int dayOffset,
      String time,
      String description,
      AppointmentStatus status) {}

  public static final List<AppointmentFixture> CATALOG =
      List.of(
          new AppointmentFixture(
              "juan", "maria", -85, "09:00", "Control de rutina y limpieza dental", COMPLETED),
          new AppointmentFixture(
              "mlopez",
              "carlos",
              -80,
              "10:30",
              "Tratamiento de endodoncia — molar superior",
              COMPLETED),
          new AppointmentFixture(
              "cgarcia", "ana", -75, "14:00", "Extracción de muela del juicio", COMPLETED),
          new AppointmentFixture(
              "ana2", "maria", -70, "11:00", "Colocación de brackets ortodóncicos", COMPLETED),
          new AppointmentFixture(
              "pedro", "luis", -65, "15:30", "Empaste de caries en premolar", COMPLETED),
          new AppointmentFixture(
              "laura", "carlos", -58, "09:30", "Segunda sesión de endodoncia", COMPLETED),
          new AppointmentFixture(
              "diego",
              "ana",
              -52,
              "14:00",
              "Control post extracción — cicatrización normal",
              COMPLETED),
          new AppointmentFixture(
              "sofia", "luis", -47, "16:00", "Blanqueamiento dental — primera sesión", COMPLETED),
          new AppointmentFixture(
              "juan",
              "carlos",
              -42,
              "10:00",
              "Tratamiento de conducto — premolar inferior",
              COMPLETED),
          new AppointmentFixture(
              "mlopez", "maria", -38, "11:30", "Ajuste de ortodoncia mensual", COMPLETED),
          new AppointmentFixture(
              "lucas", "ana", -32, "09:00", "Evaluación para corona dental", COMPLETED),
          new AppointmentFixture(
              "valeria",
              "luis",
              -28,
              "15:00",
              "Limpieza dental semestral y fluorización",
              COMPLETED),
          new AppointmentFixture(
              "pedro", "maria", -22, "10:30", "Revisión de brackets — ajuste de arco", COMPLETED),
          new AppointmentFixture(
              "cgarcia",
              "carlos",
              -17,
              "14:30",
              "Control de endodoncia — sellado definitivo",
              COMPLETED),
          new AppointmentFixture(
              "ana2", "ana", -10, "09:00", "Limpieza profunda y tratamiento de encías", COMPLETED),
          new AppointmentFixture(
              "sofia", "maria", -60, "16:00", "Consulta ortodoncia — paciente canceló", CANCELLED),
          new AppointmentFixture(
              "diego",
              "carlos",
              -45,
              "11:00",
              "Endodoncia — reprogramada por el paciente",
              CANCELLED),
          new AppointmentFixture(
              "lucas",
              "luis",
              -35,
              "13:00",
              "Blanqueamiento — cancelado por el dentista",
              CANCELLED),
          new AppointmentFixture(
              "valeria", "ana", -25, "10:00", "Control de encías — paciente ausente", CANCELLED),
          new AppointmentFixture(
              "juan",
              "luis",
              -12,
              "15:30",
              "Revisión estética — cancelada por el paciente",
              CANCELLED),
          new AppointmentFixture(
              "mlopez",
              "maria",
              0,
              "09:00",
              "Sesión de ortodoncia — ajuste trimestral en curso",
              IN_PROGRESS),
          new AppointmentFixture(
              "pedro",
              "carlos",
              0,
              "11:00",
              "Tratamiento de conducto — segunda sesión en curso",
              IN_PROGRESS),
          new AppointmentFixture(
              "laura", "ana", 0, "14:30", "Cirugía de tejido blando — en progreso", IN_PROGRESS),
          new AppointmentFixture(
              "juan", "maria", 2, "09:00", "Control de ortodoncia — revisión mensual", SCHEDULED),
          new AppointmentFixture(
              "cgarcia", "carlos", 3, "10:30", "Evaluación para implante dental", SCHEDULED),
          new AppointmentFixture(
              "sofia", "ana", 4, "14:00", "Tratamiento periodontal — seguimiento", SCHEDULED),
          new AppointmentFixture(
              "valeria", "luis", 5, "11:00", "Segunda sesión de blanqueamiento", SCHEDULED),
          new AppointmentFixture(
              "diego", "maria", 7, "15:30", "Colocación de retenedor post ortodoncia", SCHEDULED),
          new AppointmentFixture(
              "lucas",
              "carlos",
              8,
              "09:30",
              "Extracción de tercer molar — turno programado",
              SCHEDULED),
          new AppointmentFixture(
              "ana2", "luis", 10, "16:00", "Consulta pediátrica para hijo del paciente", SCHEDULED),
          new AppointmentFixture(
              "mlopez", "ana", 11, "10:00", "Control de encías — revisión trimestral", SCHEDULED),
          new AppointmentFixture(
              "pedro", "maria", 12, "11:30", "Ajuste de arco ortodóncico", SCHEDULED),
          new AppointmentFixture(
              "laura",
              "carlos",
              14,
              "14:00",
              "Tratamiento de endodoncia — primera sesión",
              SCHEDULED),
          new AppointmentFixture(
              "juan", "luis", 15, "09:00", "Carillas de porcelana — consulta inicial", SCHEDULED),
          new AppointmentFixture(
              "valeria",
              "maria",
              18,
              "15:00",
              "Revisión general y plan de tratamiento",
              SCHEDULED));

  private DevAppointmentFixtures() {}
}
