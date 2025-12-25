package com.dk_power.power_plant_java.entities.esp;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
@Table(name = "esp_devices")
public class EspDevice extends BaseAuditEntity {
    
    @Column(nullable = false, unique = true)
    private String ipAddress;
    
    @Column(nullable = false)
    private String name; // e.g., "ESP-1", "ESP-2"
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    private String description;
}