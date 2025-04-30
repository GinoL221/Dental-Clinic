package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IAppointmentRepository extends JpaRepository<Appointment, Long> {
}
