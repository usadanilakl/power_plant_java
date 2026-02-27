package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PackageModification {
    private String timestamp;
    private String action;          // FIELD_CHANGED, PERMIT_ADDED, PERMIT_REMOVED, STATUS_CHANGED
    private String permitType;      // SafeWork, HotWork, etc. (null for package-level)
    private Long permitId;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private String description;
}
