package com.dk_power.power_plant_java.entities.files;

import com.dk_power.power_plant_java.entities.plant.Syst;
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
    private String type;
    private String name;
    private String link;
    private Syst sytem;
    private String number;
    private String vendor;
    @Id
    @GeneratedValue
    private Long id;
}
