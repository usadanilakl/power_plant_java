package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class TagNumberPrint {
    @JsonProperty("tagNumber")
    private String tagNumber;

    @JsonProperty("description")
    private String description;
}
