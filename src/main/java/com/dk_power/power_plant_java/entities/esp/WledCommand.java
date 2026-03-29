package com.dk_power.power_plant_java.entities.esp;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.enums.WledCommandStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class WledCommand extends BaseIdEntity {

    private String espDeviceIp;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    private WledCommandStatus commandStatus = WledCommandStatus.PENDING;

    private int retryCount = 0;
    private int maxRetries = 5;
    private LocalDateTime nextRetryAt;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    private Integer boxNumber;

    private LocalDateTime createdAt = LocalDateTime.now();
}
