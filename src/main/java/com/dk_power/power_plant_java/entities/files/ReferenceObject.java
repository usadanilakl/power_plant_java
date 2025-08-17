package com.dk_power.power_plant_java.entities.files;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReferenceObject {
    static {
    System.err.println("ReferenceObject class loaded");
}
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    public enum ReferenceType {
        VALVE_LIST,
        PIPE_LIST
    }

    @Enumerated(EnumType.STRING)
    private ReferenceType referenceType;

    public enum ReferenceGroup {
        HRSG,
        BOP
    }

    @Enumerated(EnumType.STRING)
    private ReferenceGroup referenceGroup;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String tagNumbers;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String fileNumbers;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String characteristics;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String references;

    private static final ObjectMapper mapper = new ObjectMapper();


    public List<String> getTagNumbers() throws Exception {
        if (this.tagNumbers == null) return null;
        return mapper.readValue(this.tagNumbers, new TypeReference<List<String>>() {
        });
    }

    public List<String> getFileNumbers() throws Exception {
        if (this.fileNumbers == null) return null;
        return mapper.readValue(this.fileNumbers, new TypeReference<List<String>>() {
        });
    }


    public Map<String, String> getCharacteristics() throws Exception {
        if (this.characteristics == null) return null;
        return mapper.readValue(this.characteristics, new TypeReference<Map<String, String>>() {
        });
    }

    public Map<String, String> getReferences() throws Exception {
        if (this.references == null) return null;
        return mapper.readValue(this.references, new TypeReference<Map<String, String>>() {
        });
    }

    public void setTagNumbers(Object tagNumbersInput) {
        try {
            if (tagNumbersInput instanceof String) {
                String tagNumbersString = (String) tagNumbersInput;
                List<String> tagNumbersList = new java.util.ArrayList<>();
                if (tagNumbersString != null && !tagNumbersString.isEmpty()) {
                    String[] numbers = tagNumbersString.split(",");
                    for (String number : numbers) {
                        tagNumbersList.add(number.trim());
                    }
                }
                this.tagNumbers = mapper.writeValueAsString(tagNumbersList);
            } else if (tagNumbersInput instanceof List) {
                this.tagNumbers = mapper.writeValueAsString(tagNumbersInput);
            } else {
                throw new IllegalArgumentException("Input must be either a String or a List<String>");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error setting tag numbers", e);
        }
    }

    // Helper methods for fileNumbers
    public void setFileNumbers(Object fileNumbersInput) {
        try {
            if (fileNumbersInput instanceof String) {
                String fileNumbersString = (String) fileNumbersInput;
                List<String> fileNumbersList = new java.util.ArrayList<>();
                if (fileNumbersString != null && !fileNumbersString.isEmpty()) {
                    String[] numbers = fileNumbersString.split(",");
                    for (String number : numbers) {
                        fileNumbersList.add(number.trim());
                    }
                }
                this.fileNumbers = mapper.writeValueAsString(fileNumbersList);
            } else if (fileNumbersInput instanceof List) {
                this.fileNumbers = mapper.writeValueAsString(fileNumbersInput);
            } else {
                throw new IllegalArgumentException("Input must be either a String or a List<String>");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error setting file numbers", e);
        }
    }

    public void setCharacteristics(Object characteristicsInput) {
        try {
            if (characteristicsInput instanceof String) {
                String characteristicsString = (String) characteristicsInput;
                Map<String, String> characteristicsMap = new HashMap<>();
                if (characteristicsString != null && !characteristicsString.isEmpty()) {
                    String[] pairs = characteristicsString.split(",");
                    for (String pair : pairs) {
                        String[] keyValue = pair.split(":");
                        if (keyValue.length == 2) {
                            characteristicsMap.put(keyValue[0].trim(), keyValue[1].trim());
                        }
                    }
                }
                this.characteristics = mapper.writeValueAsString(characteristicsMap);
            } else if (characteristicsInput instanceof Map) {
                this.characteristics = mapper.writeValueAsString(characteristicsInput);
            } else {
                throw new IllegalArgumentException("Input must be either a String or a Map<String, String>");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error setting characteristics", e);
        }
    }

    public void setReferences(Object referencesInput) {
        try {
            if (referencesInput instanceof String) {
                String referencesString = (String) referencesInput;
                Map<String, String> referencesMap = new HashMap<>();
                if (referencesString != null && !referencesString.isEmpty()) {
                    String[] pairs = referencesString.split(",");
                    for (String pair : pairs) {
                        String[] keyValue = pair.split(":");
                        if (keyValue.length == 2) {
                            referencesMap.put(keyValue[0].trim(), keyValue[1].trim());
                        }
                    }
                }
                this.references = mapper.writeValueAsString(referencesMap);
            } else if (referencesInput instanceof Map) {
                this.references = mapper.writeValueAsString(referencesInput);
            } else {
                throw new IllegalArgumentException("Input must be either a String or a Map<String, String>");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error setting references", e);
        }
    }


    public void addTagNumber(String tagNumber) {
        try {
            List<String> currentTagNumbers = getTagNumbers();
            if (currentTagNumbers == null) {
                currentTagNumbers = new ArrayList<>();
            }
            if (!currentTagNumbers.contains(tagNumber.trim())) {
                currentTagNumbers.add(tagNumber.trim());
                this.tagNumbers = mapper.writeValueAsString(currentTagNumbers);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error adding tag number", e);
        }
    }

    public void addFileNumber(String fileNumber) {
        try {
            List<String> currentFileNumbers = getFileNumbers();
            if (currentFileNumbers == null) {
                currentFileNumbers = new ArrayList<>();
            }
            if (!currentFileNumbers.contains(fileNumber.trim())) {
                currentFileNumbers.add(fileNumber.trim());
                this.fileNumbers = mapper.writeValueAsString(currentFileNumbers);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error adding file number", e);
        }
    }

    public void addCharacteristic(String key, String value) {
        try {
            Map<String, String> currentCharacteristics = getCharacteristics();
            if (currentCharacteristics == null) {
                currentCharacteristics = new HashMap<>();
            }
            currentCharacteristics.put(key.trim(), value.trim());
            this.characteristics = mapper.writeValueAsString(currentCharacteristics);
        } catch (Exception e) {
            throw new RuntimeException("Error adding characteristic", e);
        }
    }

    public void addReference(String key, String value) {
        try {
            Map<String, String> currentReferences = getReferences();
            if (currentReferences == null) {
                currentReferences = new HashMap<>();
            }
            currentReferences.put(key.trim(), value.trim());
            this.references = mapper.writeValueAsString(currentReferences);
        } catch (Exception e) {
            throw new RuntimeException("Error adding reference", e);
        }
    }

@Override
public String toString() {
    StringBuilder sb = new StringBuilder("ReferenceObject {\n");
    try {
        sb.append("  id: ").append(id).append("\n");
        sb.append("  description: ").append(description).append("\n");
        sb.append("  referenceType: ").append(referenceType).append("\n");
        sb.append("  referenceGroup: ").append(referenceGroup).append("\n");
        sb.append("  tagNumbers: ").append(formatList(getTagNumbers())).append("\n");
        sb.append("  fileNumbers: ").append(formatList(getFileNumbers())).append("\n");
        sb.append("  characteristics: ").append(formatMap(getCharacteristics())).append("\n");
        sb.append("  references: ").append(formatMap(getReferences())).append("\n");
    } catch (Exception e) {
        sb.append("  Error parsing JSON: ").append(e.getMessage()).append("\n");
    }
    sb.append("}");
    return sb.toString();
}

private String formatList(List<String> list) {
    if (list == null || list.isEmpty()) {
        return "[]";
    }
    return "[\n    " + String.join(",\n    ", list) + "\n  ]";
}

private String formatMap(Map<String, String> map) {
    if (map == null || map.isEmpty()) {
        return "{}";
    }
    StringBuilder mapString = new StringBuilder("{\n");
    for (Map.Entry<String, String> entry : map.entrySet()) {
        mapString.append("    ").append(entry.getKey()).append(": ")
                 .append(entry.getValue()).append(",\n");
    }
    mapString.delete(mapString.length() - 2, mapString.length()); // Remove last comma and newline
    mapString.append("\n  }");
    return mapString.toString();
}


}