package com.dk_power.power_plant_java.entities.forms;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class PrintableForm extends BaseAuditEntity {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "printable_form_id")
    private Set<FormContainer> formContainers = new HashSet<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String size;
    private String formType;

    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();


    public Map<String, Object> getSize() {
        try {
            if (size == null || size.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(size, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing size JSON", e);
        }
    }


    public void setSize(Map<String, Object> size) {
        try {
            this.size = objectMapper.writeValueAsString(size);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing size to JSON", e);
        }
    }

    public void addFormContainer(FormContainer formContainer){
        formContainers.add(formContainer);
    }
    public void removeFormContainer(FormContainer formContainer){
        formContainers.remove(formContainer);
    }
}
