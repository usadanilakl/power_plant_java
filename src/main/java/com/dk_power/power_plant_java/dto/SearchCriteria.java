package com.dk_power.power_plant_java.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SearchCriteria {
    public enum SearchType {
        GLOBAL,
        COLUMN
    }

    private SearchType type;
    private String query;
    private Map<String, String> filters;

    // No need for getters and setters due to Lombok annotations
}