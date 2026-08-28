package com.dh.dentalClinicMVC.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(
    name = "appointments",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_appointment_active_dentist_slot",
          columnNames = {"dentist_id", "date", "time", "active_slot"})
    },
    indexes = {
      @Index(name = "idx_appointment_date", columnList = "date"),
      @Index(name = "idx_appointment_status", columnList = "status"),
      @Index(name = "idx_appointment_patient", columnList = "patient_id"),
      @Index(name = "idx_appointment_dentist", columnList = "dentist_id")
    })
public class Appointment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne private Patient patient;

  @ManyToOne(optional = false)
  @JoinColumn(name = "dentist_id", nullable = false)
  private Dentist dentist;

  @Column(name = "date", nullable = false)
  private LocalDate date;

  @Column(name = "time", nullable = false)
  private LocalTime time;

  @Column(name = "description", length = 500)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private AppointmentStatus status = AppointmentStatus.SCHEDULED;

  @Column(
      name = "active_slot",
      columnDefinition =
          "int generated always as (case when status <> 'CANCELLED' then 1 else null end)",
      insertable = false,
      updatable = false)
  private Integer activeSlot;

  public Appointment() {}
}
