package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.esp.LedStrip;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Audited
@Table(name = "loto_boxes")
public class LotoBox extends BaseAuditEntity {
    private Integer number = 0;
    
    @OneToOne
    @JoinColumn(name = "loto")
    private Loto loto;
    
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name="loto_accessory_status_id")
    private Value lotoAccessoryStatus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "led_strip_id", nullable = false)
    private LedStrip ledStrip; // Which LED strip this box is on
    
    @Column(nullable = false)
    private Integer rangeStart; // LED range start on the strip
    
    @Column(nullable = false)
    private Integer rangeEnd; // LED range end on the strip

    private String description;

    // Current LED color state (persisted to database)
    @Column(nullable = false)
    private Integer r = 0; // Red value (0-255)

    @Column(nullable = false)
    private Integer g = 0; // Green value (0-255)

    @Column(nullable = false)
    private Integer b = 32; // Blue value (0-255), default to dark blue (closed)

    @Column(nullable = false)
    private Integer brightness = 255; // Brightness (0-255)
}
