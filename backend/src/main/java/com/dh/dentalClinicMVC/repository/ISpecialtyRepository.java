package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ISpecialtyRepository extends JpaRepository<Specialty, Long> {
    Optional<Specialty> findByName(String name);
}
