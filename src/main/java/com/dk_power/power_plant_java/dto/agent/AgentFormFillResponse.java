package com.dk_power.power_plant_java.dto.agent;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AgentFormFillResponse {
    private Map<String, Object> fieldValues;
    private String message;
    private boolean success;
}
