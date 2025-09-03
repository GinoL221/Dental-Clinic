package com.dh.dentalClinicMVC.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "street", nullable = false)
    private String street;

    @Column(name = "number", nullable = false)
    private Long number;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "province", nullable = false)
    private String province;

    public Address() {
    }
}
