package com.dk_power.power_plant_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SearchCriteria {
    private Map<String, String> filters;

    // getters and setters
}