package com.dk_power.power_plant_java.dto.agent;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class AgentFormFillRequest {
    private String formType;
    private String userMessage;
    private List<FieldSpec> fields;
    private Map<String, Object> currentValues;
    private Map<String, String> formContext;

    @Getter
    @Setter
    public static class FieldSpec {
        private String name;
        private String label;
        private String type;
        private String categoryAlias;
    }
}
