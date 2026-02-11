package com.dk_power.power_plant_java.dto.sharepoint;

import lombok.Data;

@Data
public class SyncResult {
    private int created;
    private int updated;
    private int autoClosed;
    private int skipped;
    private int failed;
    private String errorMessage;

    public SyncResult() {
        this.created = 0;
        this.updated = 0;
        this.autoClosed = 0;
        this.skipped = 0;
        this.failed = 0;
    }

    public void incrementCreated() {
        this.created++;
    }

    public void incrementUpdated() {
        this.updated++;
    }

    public void incrementAutoClosed() {
        this.autoClosed++;
    }

    public void incrementSkipped() {
        this.skipped++;
    }

    public void incrementFailed() {
        this.failed++;
    }

    public int getTotalChanges() {
        return created + updated + autoClosed;
    }

    public boolean hasErrors() {
        return failed > 0 || errorMessage != null;
    }

    public static SyncResult error(String message) {
        SyncResult result = new SyncResult();
        result.setErrorMessage(message);
        return result;
    }
}
