package com.dk_power.power_plant_java.dto.categories;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
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