package com.dk_power.power_plant_java.dto.categories;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String alias;
    @JsonIgnore
    private List<ValueDto> values = new ArrayList<>();

    @Override
    public String toString() {
        return "CategoryDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}