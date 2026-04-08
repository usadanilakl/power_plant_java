package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
@Table(indexes = {
        @Index(name = "idx_etapro_reading_point_time", columnList = "pointId, readingTime"),
        @Index(name = "idx_etapro_reading_session", columnList = "scrapeSessionId")
})
public class EtaProReading extends BaseIdEntity {
    private String pointId;
    /** Renamed from "timestamp" which is a SQL reserved word on H2 and Postgres. */
    private LocalDateTime readingTime;
    /** Renamed from "value" which is a SQL reserved word on H2 and Postgres. */
    private Double readingValue;
    private String quality;
    private String scrapeSessionId;
}
