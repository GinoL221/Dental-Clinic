package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.model.Dentist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IDentistRepository extends JpaRepository<Dentist, Long> {
}
