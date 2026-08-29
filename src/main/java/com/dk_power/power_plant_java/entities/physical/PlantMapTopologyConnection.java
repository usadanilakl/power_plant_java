package com.dk_power.power_plant_java.entities.physical;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

/**
 * One canonical Plant Map junction. Pipe geometry only identifies its two ends;
 * every actual attachment lives here once, even when it crosses diagram/section boundaries.
 */
@Entity
@Table(name = "plant_map_topology_connection", indexes = {
    @Index(name = "idx_plant_map_topology_key", columnList = "connection_key")
})
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class PlantMapTopologyConnection extends BaseAuditEntity {

    @Column(name = "connection_key", nullable = false, length = 255)
    private String connectionKey;

    @Column(nullable = false, length = 32)
    private String kind;

    private Long equipmentObjectId;

    @Column(length = 255)
    private String equipmentPortId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String terminalsJson = "[]";
}
