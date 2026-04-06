package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs all merge services once at startup to clean up any existing duplicates.
 * Hub-only: dedup decisions must come from one place to avoid conflicting merges
 * (e.g., hub keeps Value A, client keeps Value B → both delete the other's pick).
 * Clients receive the merge results (deletes + re-pointed references) via sync.
 */
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
@Order(200) // Run after AdminUserSeeder and SequenceInitializer
public class StartupMergeRunner {

    private final CategoryValueMergeService categoryValueMergeService;
    private final WorkRequestMergeService workRequestMergeService;
    private final JhaMergeService jhaMergeService;
    private final EmailCorrespondenceMergeService emailCorrespondenceMergeService;
    private final UserMergeService userMergeService;
    private final ConversationMergeService conversationMergeService;
    private final MessageMergeService messageMergeService;

    @EventListener(ApplicationReadyEvent.class)
    public void runStartupMerge() {
        try {
            log.info("Running startup merge to resolve any existing duplicates...");
            categoryValueMergeService.mergeIfDuplicatesExist();
            workRequestMergeService.mergeIfDuplicatesExist();
            jhaMergeService.mergeIfDuplicatesExist();
            emailCorrespondenceMergeService.mergeIfDuplicatesExist();
            userMergeService.mergeIfDuplicatesExist();
            conversationMergeService.mergeIfDuplicatesExist();
            messageMergeService.mergeIfDuplicatesExist();
            log.info("Startup merge complete");
        } catch (Exception e) {
            log.error("Startup merge failed (non-fatal): {}", e.getMessage());
        }
    }
}
