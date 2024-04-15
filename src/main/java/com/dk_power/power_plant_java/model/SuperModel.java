package com.dk_power.power_plant_java.model;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Data
@MappedSuperclass
@Builder
public class SuperModel {
    private LocalDateTime created;
    private LocalDateTime modified;
    private String createdBy;
    private String modifiedBy;
    @Id
    @GeneratedValue
    private Long id;
}
