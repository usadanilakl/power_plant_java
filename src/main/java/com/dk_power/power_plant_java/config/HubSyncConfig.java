package com.dk_power.power_plant_java.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Getter
@Slf4j
public class HubSyncConfig {

    @Value("${sync.hub.file-storage-path:./hub-file-storage}")
    private String fileStoragePath;

    @Value("${sync.hub.retention-days:90}")
    private int retentionDays;

    @Value("${sync.hub.batch-size:500}")
    private int batchSize;

    @Value("${sync.hub.compaction-enabled:true}")
    private boolean compactionEnabled;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("=====================================================");
        log.info("  HUB MODE ACTIVE - this instance serves as sync hub");
        log.info("  File storage: {}", fileStoragePath);
        log.info("  Retention: {} days", retentionDays);
        log.info("  Batch size: {}", batchSize);
        log.info("=====================================================");

        // Ensure file storage directory exists
        try {
            Path storagePath = Path.of(fileStoragePath);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
                log.info("Created hub file storage directory: {}", storagePath.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to create hub file storage directory: {}", e.getMessage());
        }
    }
}
