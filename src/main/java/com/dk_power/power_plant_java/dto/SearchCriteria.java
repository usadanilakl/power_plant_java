package com.dk_power.power_plant_java.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SearchCriteria {
    public enum SearchType {
        @JsonProperty("global")
        GLOBAL,
        @JsonProperty("column")
        COLUMN
    }

    private SearchType type;
    private String query;
    private Map<String, String> filters;
    private int page;

    // No need for getters and setters due to Lombok annotations
}