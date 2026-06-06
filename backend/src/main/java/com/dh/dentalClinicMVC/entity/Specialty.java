package com.dh.dentalClinicMVC.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

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

    @NotBlank(message = "El nombre de la especialidad no puede estar vacío")
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @ManyToMany(mappedBy = "specialties")
    @JsonIgnore
    private Set<Dentist> dentists = new HashSet<>();
}
