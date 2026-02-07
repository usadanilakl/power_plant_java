package com.dk_power.power_plant_java.dto.categories;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CategoryWithCountDto {
    private Long id;
    private String name;
    private String alias;
    private int valueCount;
}
