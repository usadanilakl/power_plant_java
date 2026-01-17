package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration to wire up file sync components.
 * Handles circular dependency between FieldChangeTracker and FileObjectSyncHandler.
 */
@Configuration
@RequiredArgsConstructor
public class FileSyncConfig {

    private final FieldChangeTracker fieldChangeTracker;
    private final FileObjectSyncHandler fileObjectSyncHandler;

    @PostConstruct
    public void init() {
        // Wire up the circular dependency
        fieldChangeTracker.setFileObjectSyncHandler(fileObjectSyncHandler);
    }
}
