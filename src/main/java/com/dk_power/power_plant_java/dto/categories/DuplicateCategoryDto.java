package com.dk_power.power_plant_java.dto.categories;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class DuplicateCategoryDto {
    private String name;
    private List<CategoryDto> categories;
}
