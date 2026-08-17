package com.dk_power.power_plant_java.entities.inventory;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Entity
@Table(name = "inventory_item", indexes = {
        @Index(name = "idx_inv_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_inv_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_inv_qr_token", columnList = "qrToken"),
        @Index(name = "idx_inv_item_type", columnList = "item_type_id"),
        @Index(name = "idx_inv_status", columnList = "status_id")
})
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class InventoryItem extends BaseAuditEntity {

    @ManyToOne
    @JoinColumn(name = "item_type_id")
    private Value itemType;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private Value status;

    /**
     * Where the item normally lives, as typed by the submitter — FREE TEXT, matching the existing
     * {@link #currentLocation} field beside it.
     *
     * <p>This used to be funnelled into {@link #location} through
     * {@code createValue("Location", locationName)}, which turned every spelling a user typed
     * ("Warehouse", "warehouse", "by the door") into a permanent Value in the Location taxonomy that
     * LOTO points and work areas share. Free text is not a controlled vocabulary; it belongs here.
     */
    private String homeLocation;

    /**
     * Optional link to a real Location Value, kept for rows written before {@link #homeLocation}
     * existed and set only when the typed text exactly matches an existing Location. NEVER
     * auto-created — see {@code InventoryItemMapper.resolveLocation}.
     */
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Value location;

    private String title;

    private String serialNumber;

    private String manufacturer;

    private String model;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(unique = true)
    private String qrToken;

    private String currentLocation;

    private String currentHolderName;

    private String currentHolderEmail;

    private Instant lastCheckedOutAt;

    private String sharepointId;

    private String localUuid;

    private Instant spModifiedTime;

    private String submitterName;

    private String submitterEmail;

    private String submitterPhone;
}
