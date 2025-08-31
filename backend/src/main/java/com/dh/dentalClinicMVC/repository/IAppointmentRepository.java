package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Appointment;
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
    @Query("SELECT a.id, a.time, p.name, d.name, a.date " +
            "FROM Appointment a " +
            "JOIN a.patient p " +
            "JOIN a.dentist d " +
            "WHERE a.date >= :fromDate " +
            "ORDER BY a.date ASC, a.time ASC")
    List<Object[]> findUpcomingAppointmentsWithDetails(@Param("fromDate") LocalDate fromDate);

    @Query("SELECT a FROM Appointment a " +
            "WHERE (:patient IS NULL OR LOWER(a.patient.name) LIKE LOWER(CONCAT('%', :patient, '%'))) " +
            "AND (:dentist IS NULL OR LOWER(a.dentist.name) LIKE LOWER(CONCAT('%', :dentist, '%'))) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.date >= :fromDate) " +
            "AND (:toDate IS NULL OR a.date <= :toDate)")
    Page<Appointment> searchAppointments(
            @Param("patient") String patient,
            @Param("dentist") String dentist,
            @Param("status") String status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);
}
