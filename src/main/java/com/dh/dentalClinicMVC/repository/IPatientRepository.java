package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPatientRepository extends JpaRepository<Patient, Long> {
}
