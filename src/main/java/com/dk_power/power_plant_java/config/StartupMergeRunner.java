package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs all merge services once at startup to clean up any existing duplicates.
 *
 * The merge normally only runs in afterCommit of applyIncomingChanges (sync).
 * If no sync changes arrive, duplicates persist indefinitely. This runner
 * ensures duplicates from prior sessions (e.g., before hub migration) are
 * resolved on the first startup.
 */
@Component
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
