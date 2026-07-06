package com.dh.dentalClinicMVC.repository;

import com.dh.dentalClinicMVC.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
}
