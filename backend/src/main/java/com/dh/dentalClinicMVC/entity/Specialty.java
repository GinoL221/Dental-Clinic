package com.dh.dentalClinicMVC.entity;

import jakarta.persistence.*;
import lombok.*;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "specialties",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_specialty_name", columnNames = "name")
        }
)
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;
}
