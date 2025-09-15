package com.dk_power.power_plant_java.entities.forms;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class FormContainer extends BaseAuditEntity {
    @Lob
    @Column(columnDefinition = "TEXT")
    private String contentJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String positionJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String sizeJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String styleJson;

    private static final ObjectMapper objectMapper = new ObjectMapper();
}
