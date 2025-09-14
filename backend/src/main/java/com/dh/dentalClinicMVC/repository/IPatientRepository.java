package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IPatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByCardIdentity(Integer cardIdentity);

    Optional<Patient> findByEmail(String email);
}
