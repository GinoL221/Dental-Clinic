package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Dentist;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IDentistRepository extends JpaRepository<Dentist, Long> {
  Optional<Dentist> findByRegistrationNumber(Integer registrationNumber);

  Optional<Dentist> findByEmail(String email);
}
