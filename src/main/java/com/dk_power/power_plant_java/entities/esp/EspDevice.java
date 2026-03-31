package com.dk_power.power_plant_java.entities.esp;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "esp_devices")
public class EspDevice extends BaseAuditEntity {
    
    @Column(unique = true)
    private String ipAddress;

    private String name; // e.g., "ESP-1", "ESP-2"

    private Boolean isActive = true;
    
    private String description;

    private String pinSequence;

    public Set<String> getPinSequence() {
        if (pinSequence == null || pinSequence.isEmpty()) return new HashSet<>();
        return new HashSet<>(Arrays.asList(pinSequence.split(",")));
    }

    public void setPinSequence(Set<String> pinSequence) {
        this.pinSequence = String.join(",", pinSequence);
    }
}