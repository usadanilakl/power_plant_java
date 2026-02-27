package com.dk_power.power_plant_java.entities.permits;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "permit_number_sequence")
@Getter
@Setter
@NoArgsConstructor
public class PermitNumberSequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    private int deviceNumber;
    private int lastSequence;
}
