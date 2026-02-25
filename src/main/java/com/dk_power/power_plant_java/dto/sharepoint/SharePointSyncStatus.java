package com.dk_power.power_plant_java.dto.sharepoint;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sync status for a single SharePoint-backed entity type.
 * Returned by the unified REST API so the frontend can display
 * sync state, hub status, and "data might be outdated" banners.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SharePointSyncStatus {
    private String entityType;
    private long lastSyncTimeMs;
    private String lastSyncTimeFormatted;
    private boolean syncEnabled;
    private boolean hubOnline;
    private boolean dataStale;
    private SyncResult lastResult;
}
