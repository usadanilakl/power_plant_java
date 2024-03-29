package com.dk_power.power_plant_java.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.*;

import org.springframework.boot.autoconfigure.domain.EntityScan;

@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Getter
@Setter
@ToString
@Builder
@MappedSuperclass
public class File {
    private String type,name,link;
    @Id
    @GeneratedValue
    private Long id;
}
