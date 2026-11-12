package com.dh.dentalClinicMVC.entity;

import jakarta.persistence.*;
import java.util.Objects;
import lombok.*;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Table(name = "addresses")
public class Address {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "street", nullable = false)
  private String street;

  @Column(name = "number", nullable = false)
  private Integer number;

  @Column(name = "location", nullable = false)
  private String location;

  @Column(name = "province", nullable = false)
  private String province;

  // Entities are identified by DB identity; lazy collections must never affect equality.
  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    return o instanceof Address other && getId() != null && getId().equals(other.getId());
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(getId());
  }
}
