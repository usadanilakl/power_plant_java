package com.dk_power.power_plant_java.dto.categories;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")

public class ValueDto {
    private Long id;
    private String name;
    private CategoryDto category;

    @Override
    public String toString() {
        return "ValueDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", group=" + category +
                '}';
    }
}