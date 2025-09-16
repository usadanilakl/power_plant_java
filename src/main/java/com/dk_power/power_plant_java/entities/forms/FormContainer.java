package com.dk_power.power_plant_java.entities.forms;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.Map;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class FormContainer extends BaseAuditEntity {
    @Lob
    @Column(columnDefinition = "TEXT")
    @JsonProperty("content")
    private String contentJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    @JsonProperty("position")
    private String positionJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    @JsonProperty("size")
    private String sizeJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    @JsonProperty("style")
    private String styleJson;
    private String groupId;

    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();


    public Map<String, Object> getContentJson() {
        try {
            if (contentJson == null || contentJson.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(contentJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing content JSON", e);
        }
    }

    public void setContentJson(Map<String, Object> content) {
        try {
            this.contentJson = objectMapper.writeValueAsString(content);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing content to JSON", e);
        }
    }

    public Map<String, Object> getPositionJson() {
        try {
            if (positionJson == null || positionJson.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(positionJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing position JSON", e);
        }
    }

    public void setPositionJson(Map<String, Object> position) {
        try {
            this.positionJson = objectMapper.writeValueAsString(position);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing position to JSON", e);
        }
    }

    public Map<String, Object> getSizeJson() {
        try {
            if (sizeJson == null || sizeJson.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(sizeJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing size JSON", e);
        }
    }

    public void setSizeJson(Map<String, Object> size) {
        try {
            this.sizeJson = objectMapper.writeValueAsString(size);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing size to JSON", e);
        }
    }

    public Map<String, Object> getStyleJson() {
        try {
            if (styleJson == null || styleJson.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(styleJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing style JSON", e);
        }
    }

    public void setStyleJson(Map<String, Object> style) {
        try {
            this.styleJson = objectMapper.writeValueAsString(style);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing style to JSON", e);
        }
    }
}