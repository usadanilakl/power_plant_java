package com.dk_power.power_plant_java.entities.files;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.*;

@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Getter
@Setter
@ToString
@Builder
public class File {
    private String type,name,link;
    @Id
    @GeneratedValue
    private Long id;
}
