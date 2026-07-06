package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IAddressRepository extends JpaRepository<Address, Long> {}
