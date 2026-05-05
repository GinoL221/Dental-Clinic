package com.dh.dentalClinicMVC.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Table(
        name = "dentists",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_dentist_registration_number", columnNames = "registration_number")
        },
        indexes = {
                @Index(name = "idx_dentist_registration_number", columnList = "registration_number")
        }
)
public class Dentist extends User {

    @Column(name = "registration_number", nullable = false)
    private Integer registrationNumber;

    @OneToMany(mappedBy = "dentist")
    @JsonIgnore
    private Set<Appointment> appointments = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "dentist_specialty",
            joinColumns = @JoinColumn(name = "dentist_id"),
            inverseJoinColumns = @JoinColumn(name = "specialty_id")
    )
    private Set<Specialty> specialties = new HashSet<>();
}
