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
    private Integer gpioPin; // GPIO pin number (e.g., 2, 4, 16)

    @Column(nullable = false)
    private Integer totalLeds = 260; // Total LEDs on this strip (Length in WLED)

    private String description;

    // WLED Configuration Settings
    @Column(nullable = false)
    private String ledType = "WS281x"; // LED type: WS281x, SK6812, APA102, etc.

    @Column(nullable = false)
    private Integer milliampsPerLed = 55; // Current per LED in milliamps (mA/LED)

    @Column(nullable = false)
    private String colorOrder = "GRB"; // Color order: GRB, RGB, BRG, etc.

    @Column(nullable = false)
    private Integer startLed = 0; // Start LED index (for skipping first LEDs)

    @Column(nullable = false)
    private Boolean reversed = false; // Whether LED order is reversed

    @Column(nullable = false)
    private Integer skipFirstLeds = 0; // Number of LEDs to skip at the beginning

    @Column(nullable = false)
    private Integer offRefreshRate = 100; // Off refresh rate (ms)
}