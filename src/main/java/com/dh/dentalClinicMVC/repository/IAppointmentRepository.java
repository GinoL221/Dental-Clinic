package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IAppointmentRepository extends JpaRepository<Appointment, Long> {
}
