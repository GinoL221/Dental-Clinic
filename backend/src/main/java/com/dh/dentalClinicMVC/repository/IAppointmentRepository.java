package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IAppointmentRepository extends JpaRepository<Appointment, Long> {
    
    /**
     * Cuenta las citas en una fecha específica
     */
    long countByDate(LocalDate date);
    
    /**
     * Cuenta las citas entre dos fechas
     */
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
}
