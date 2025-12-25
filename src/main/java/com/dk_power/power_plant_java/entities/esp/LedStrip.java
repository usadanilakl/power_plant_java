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
@Table(name = "led_strips")
public class LedStrip extends BaseAuditEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "esp_device_id", nullable = false)
    private EspDevice espDevice;
    
    @Column(nullable = false)
    private Integer stripNumber; // 0, 1, 2 per ESP
    
    @Column(nullable = false)
    private Integer gpioPin; // 4, 12, or 16
    
    @Column(nullable = false)
    private Integer totalLeds = 260; // Total LEDs on this strip
    
    private String description;
}