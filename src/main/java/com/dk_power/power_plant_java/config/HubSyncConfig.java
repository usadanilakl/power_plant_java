package com.dk_power.power_plant_java.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

@Configuration
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Getter
@Slf4j
public class HubSyncConfig {

    @Value("${files.root.path}")
    private String filesRootPath;

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
        log.info("  File storage: {}", filesRootPath);
        log.info("  Retention: {} days", retentionDays);
        log.info("  Batch size: {}", batchSize);
        log.info("=====================================================");
    }
}
