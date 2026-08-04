package com.dk_power.power_plant_java.entities.forms;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class PrintableForm extends BaseAuditEntity {
    /**
     * EAGER on purpose. A PrintableForm without its containers is meaningless — every endpoint
     * that returns one serializes the containers with it — and the app runs with
     * {@code spring.jpa.open-in-view=false}, so a LAZY collection throws
     * LazyInitializationException in the Jackson converter (the session is already closed by the
     * time the response is written). That took every paper form offline with a 500. This table
     * holds ~12 rows, so eager loading is cheap and removes the whole class of failure.
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "printable_form_id")
    private Set<FormContainer> formContainers = new HashSet<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String size;
    private String formType;
    private Boolean isPrimary = false;

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
