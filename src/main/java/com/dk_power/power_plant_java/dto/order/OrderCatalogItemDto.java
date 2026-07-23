package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** A vendor in the ordering catalog (seeded from email-reorder.mc, editable via the catalog admin editor). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCatalogItemDto {
    /** SharePoint list-item id — null until persisted. */
    private String sharepointId;
    /** Stable natural key (co2, hydrogen, demin_trailers, …) — the idempotent upsert key. */
    private String itemKey;
    private String displayName;
    private String vendor;
    /** Vendor order-desk email. Nullable (e.g. Demin Trailers = TBD → item stays inactive until set). */
    private String contactEmail;
    /** CC recipients (comma/;-separated). */
    private String ccEmails;
    /** Free-text body directive carried onto every order (e.g. Univar "Tag @Greg Voigt in body"). */
    private String bodyNote;
    private String blanketPoNumber;
    /** Quantity unit (LBS, Gallons); nullable. */
    private String unit;
    /** QUANTITY (default — pick presets, enter qty) or FILL (top-off equipment: order = sum(capacity − current level) per product). */
    @Builder.Default
    private String orderMode = "QUANTITY";
    @Builder.Default
    private List<OrderPresetDto> defaultQtyPresets = new ArrayList<>();
    @Builder.Default
    private List<OrderTextOptionDto> textOptions = new ArrayList<>();
    @Builder.Default
    private boolean active = true;
    private Integer sortOrder;
}
