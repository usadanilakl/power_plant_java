package com.dk_power.power_plant_java.dto.agent;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class AgentFormFillResponse {
    private Map<String, Object> fieldValues;
    private String message;
    private boolean success;
    private List<String> guidance;

    public AgentFormFillResponse(Map<String, Object> fieldValues, String message, boolean success) {
        this(fieldValues, message, success, new ArrayList<>());
    }

    public AgentFormFillResponse(Map<String, Object> fieldValues, String message, boolean success, List<String> guidance) {
        this.fieldValues = fieldValues;
        this.message = message;
        this.success = success;
        this.guidance = guidance != null ? guidance : new ArrayList<>();
    }
}
