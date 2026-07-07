package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.esp.LedStrip;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
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
    @JoinColumn(name = "led_strip_id")
    private LedStrip ledStrip; // Which LED strip this box is on

    private Integer rangeStart; // LED range start on the strip

    private Integer rangeEnd; // LED range end on the strip

    private String description;

    private Integer setSize = 0; // Number of locks in this box's set (0 = no set)

    private Boolean active = true; // soft-delete flag for boxes the operator removed

    private Boolean portable = false; // portable boxes render outside the fixed 12x6 grid

    // Current LED color state (persisted to database)
    private Integer r = 0; // Red value (0-255)

    private Integer g = 0; // Green value (0-255)

    private Integer b = 32; // Blue value (0-255), default to dark blue (closed)

    private Integer brightness = 255; // Brightness (0-255)

    /**
     * When true, operator has manually set this box's color and does not want
     * LOTO status transitions to overwrite it. LOTO-driven color updates
     * ({@code updateBoxColorForStatus}) are skipped while this flag is set.
     * Set/cleared explicitly via the manual-override endpoint on the box grid.
     */
    private Boolean manualOverride = false;
}
