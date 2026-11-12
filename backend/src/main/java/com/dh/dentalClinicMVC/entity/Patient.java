package com.dh.dentalClinicMVC.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import lombok.*;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Table(
    name = "patients",
    uniqueConstraints = {
      @UniqueConstraint(name = "uk_patient_card_identity", columnNames = "card_identity")
    },
    indexes = {@Index(name = "idx_patient_card_identity", columnList = "card_identity")})
public class Patient extends User {

  @Column(name = "card_identity", nullable = false)
  private Integer cardIdentity;

  @Column(name = "admission_date", nullable = false)
  private LocalDate admissionDate;

  @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JoinColumn(name = "address_id")
  private Address address;

  @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private Set<Appointment> appointments = new HashSet<>();

  // Entities are identified by DB identity; lazy collections must never affect equality.
  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    return o instanceof Patient other && getId() != null && getId().equals(other.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(getId());
  }
}
