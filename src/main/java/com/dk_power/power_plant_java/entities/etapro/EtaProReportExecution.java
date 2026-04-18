package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
        @Index(name = "idx_report_exec_status", columnList = "status"),
        @Index(name = "idx_report_exec_report", columnList = "report_id")
})
public class EtaProReportExecution extends BaseAuditEntity {

    public enum Status { PENDING, RUNNING, COMPLETE, FAILED, CANCELLED }

    @ManyToOne
    @JoinColumn(name = "report_id")
    private EtaProReport report;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    /** Runtime params supplied by the user for this execution. */
    @Column(columnDefinition = "TEXT")
    private String paramsJson;

    /** Summary statistics (aggregations) — small, always loaded. */
    @Column(columnDefinition = "TEXT")
    private String summaryJson;

    /** Full result payload — event instances with measurements + chart slices. */
    @Column(columnDefinition = "TEXT")
    private String resultPayloadJson;

    private int progress;           // 0-100
    private int instancesFound;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;

    @Column(length = 1000)
    private String errorMessage;
}
