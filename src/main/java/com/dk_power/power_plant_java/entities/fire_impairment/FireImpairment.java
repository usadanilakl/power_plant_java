package com.dk_power.power_plant_java.entities.fire_impairment;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class FireImpairment extends BaseIdEntity {

    private String email;
    private String emailCc;
    private String clientName;
    private String indexNumber;
    private String streetAddress;
    private String state;
    private String city;
    private String country;
    private String phone;
    private String valveNumber;
    private String areaProtected;
    @Column(columnDefinition = "TEXT")
    private String reason;
    private String office;
    private String protectionType;
    private String submissionDate;
    private String predictedRestorationDate;
    private String closedDate;
    private String canceledDate;
    @Column(columnDefinition = "TEXT")
    private String precautions;
    private Boolean isActive = true;
    private String url;

    @Enumerated(EnumType.STRING)
    private FireImpairmentLocation location;
}
