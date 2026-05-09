package com.dk_power.power_plant_java.entities.inventory;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Entity
@Table(name = "inventory_usage", indexes = {
        @Index(name = "idx_invu_item", columnList = "inventory_item_id"),
        @Index(name = "idx_invu_scanned_at", columnList = "scannedAt"),
        @Index(name = "idx_invu_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_invu_local_uuid", columnList = "localUuid")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class InventoryUsage extends BaseAuditEntity {

    @ManyToOne
    @JoinColumn(name = "inventory_item_id")
    private InventoryItem inventoryItem;

    private String userName;

    private String userEmail;

    private String location;

    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private Instant scannedAt;

    private Instant returnedAt;

    /** "checkout" | "checkin" */
    private String eventType;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;
}
