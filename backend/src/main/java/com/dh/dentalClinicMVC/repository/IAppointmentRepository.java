package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface IAppointmentRepository extends JpaRepository<Appointment, Long> {
    long countByDate(LocalDate date);

    long countByDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Obtiene las próximas citas con detalles de paciente y dentista
     */

    // Consulta para obtener las próximas citas con detalles de paciente y dentista
    @Query("SELECT a.id, a.time, CONCAT(p.firstName, ' ', p.lastName) AS patientName, CONCAT(d.firstName, ' ', d.lastName) AS dentistName, a.date, a.status " +
            "FROM Appointment a " +
            "JOIN a.patient p " +
            "JOIN a.dentist d " +
            "WHERE a.date >= :fromDate " +
            "ORDER BY a.date ASC, a.time ASC")
    List<Object[]> findUpcomingAppointmentsWithDetails(@Param("fromDate") LocalDate fromDate);

    // Consulta para buscar citas con filtros
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointments(
            @Param("patient") String patient,
            @Param("dentist") String dentist,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Consulta para buscar citas por ID de paciente
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patientId IS NULL OR a.patient.id = :patientId) " +
            "AND (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientId(
            @Param("patientId") Long patientId,
            @Param("dentist") String dentist,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Consulta para buscar citas por ID de dentista
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:dentistId IS NULL OR a.dentist.id = :dentistId) " +
            "AND (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByDentistId(
            @Param("dentistId") Long dentistId,
            @Param("patient") String patient,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Consulta para buscar citas por ID de paciente y dentista
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patientId IS NULL OR a.patient.id = :patientId) " +
            "AND (:dentistId IS NULL OR a.dentist.id = :dentistId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientIdAndDentistId(
            @Param("patientId") Long patientId,
            @Param("dentistId") Long dentistId,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Consulta para buscar citas por ID de paciente y dentista
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:dentistId IS NULL OR a.dentist.id = :dentistId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientNameAndDentistId(
            @Param("patient") String patient,
            @Param("dentistId") Long dentistId,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Consulta para buscar citas por ID de paciente y dentista
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patientId IS NULL OR a.patient.id = :patientId) " +
            "AND (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientIdAndDentistName(
            @Param("patientId") Long patientId,
            @Param("dentist") String dentist,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Buscar por nombre de paciente Y nombre de odontólogo
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientNameAndDentistName(
            @Param("patient") String patient,
            @Param("dentist") String dentist,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Buscar solo por nombre de paciente (y opcionalmente nombre de odontólogo)
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByPatientName(
            @Param("patient") String patient,
            @Param("dentist") String dentist,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Buscar solo por nombre de odontólogo (y opcionalmente nombre de paciente)
    @Query("SELECT a FROM Appointment a " +
            "WHERE (:dentist IS NULL OR LOWER(CONCAT(a.dentist.firstName, ' ', a.dentist.lastName)) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:patient IS NULL OR LOWER(CONCAT(a.patient.firstName, ' ', a.patient.lastName)) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointmentsByDentistName(
            @Param("dentist") String dentist,
            @Param("patient") String patient,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);
}
