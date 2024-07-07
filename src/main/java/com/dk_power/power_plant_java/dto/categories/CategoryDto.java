package com.dk_power.power_plant_java.dto.categories;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;


@NoArgsConstructor
@Getter
@Setter
public class CategoryDto {

    private Long id;
    private String name;
    private List<ValueDto> values = new ArrayList<>();
}