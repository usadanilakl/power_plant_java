package com.dk_power.power_plant_java.sevice.email;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import com.dk_power.power_plant_java.dto.pwa.PwaJhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
import com.dk_power.power_plant_java.sevice.pwa.PwaJhaService;
import com.dk_power.power_plant_java.sevice.pwa.PwaWorkRequestService;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scheduled service for polling the monitored email inbox for new responses.
 * Runs at configured intervals (default 10 minutes) to check for new emails
 * and match them to entities via EmailResponseMatcherService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailPollingService {
    private final ApiEmailService apiEmailService;
    private final EmailResponseMatcherService matcherService;
    private final EmailCorrespondenceRepo correspondenceRepo;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    @Lazy private final CentralSyncService centralSyncService;
    @Lazy private final PwaWorkRequestService pwaWorkRequestService;
    @Lazy private final PwaJhaService pwaJhaService;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${email.graph.from}")
    private String monitoredEmail;

    private LocalDateTime lastPollTime = LocalDateTime.now().minusDays(7);

    private static final Pattern SP_PATTERN = Pattern.compile("\\[SP:([^\\]]+)\\]");
    private static final Pattern PWA_WR_PATTERN = Pattern.compile("\\[PWA:WR:([^\\]]+)\\]");
    private static final Pattern PWA_JHA_PATTERN = Pattern.compile("\\[PWA:JHA:([^\\]]+)\\]");

    /**
     * Scheduled task to poll for new email responses.
     * Runs every 10 minutes by default (configurable via email.poll.interval).
     * Only the hub polls — clients receive data via sync.
     */
    @Scheduled(fixedDelayString = "${email.poll.interval:600000}", initialDelay = 30_000) // 10 minutes default, 30s startup delay
    public void pollForNewResponses() {
        if (!syncConfig.isHubMode()) return;
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("email.pollForNewResponses")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("[EmailPoll] Checking for emails since {}", lastPollTime);

            List<GraphEmailMessage> newMessages =
                apiEmailService.getMessagesSince(monitoredEmail, lastPollTime, 100);

            log.info("[EmailPoll] Found {} new messages", newMessages.size());

            for (GraphEmailMessage message : newMessages) {
                processIncomingMessage(message);
            }

            lastPollTime = LocalDateTime.now();
            log.info("email.poll.complete messageCount={} durationMs={}",
                newMessages.size(), System.currentTimeMillis() - start);

        } catch (Exception e) {
            log.error("[EmailPoll] Error during polling", e);
        }
    }

    /**
     * Processes a single incoming email message.
     * First checks if it's a PWA fallback submission email (auto-processes it).
     * Otherwise checks for duplicates, filters for relevance, matches to entity, and saves if matched.
     */
    private void processIncomingMessage(GraphEmailMessage message) {
        if (message == null || message.getId() == null) {
            log.warn("[EmailPoll] Received null or invalid message");
            return;
        }

        // Skip if already processed (prevent duplicates)
        if (correspondenceRepo.findByGraphMessageId(message.getId()).isPresent()) {
            log.debug("[EmailPoll] Message already processed: {}", message.getId());
            return;
        }

        // Check if this is a PWA fallback submission email and auto-process it
        if (message.getSubject() != null && tryAutoProcessPwaSubmission(message)) {
            return; // Successfully auto-processed (or duplicate detected)
        }

        // Filter: only process emails that are relevant to our system
        if (!isRelevantEmail(message)) {
            log.debug("[EmailPoll] Skipping irrelevant email from '{}' with subject: {}",
                message.getSenderEmail(), message.getSubject());
            return;
        }

        // Try to match to an entity
        Optional<EmailResponseMatcherService.CorrespondenceMatch> match =
            matcherService.matchEmailToEntity(message);

        if (match.isPresent()) {
            saveInboundCorrespondence(message, match.get());
        } else {
            // Save unmatched email for later retry — outbound records may arrive via sync
            log.warn("[EmailPoll] Could not match email to entity - saving for later retry. Subject: {}, From: {}",
                message.getSubject(), message.getSenderEmail());
            saveUnmatchedCorrespondence(message);
        }
    }

    /**
     * Determines if an incoming email is relevant to our system.
     * An email is relevant if:
     * 1. Its conversationId matches a known conversation we initiated, OR
     * 2. Its subject contains our outbound email markers ([SP:, [PWA:,
     *    "Additional Information Required", "Permit Package")
     */
    private boolean isRelevantEmail(GraphEmailMessage message) {
        // Check 1: conversation ID matches a known thread we started
        if (message.getConversationId() != null && !message.getConversationId().isEmpty()
                && correspondenceRepo.existsByConversationId(message.getConversationId())) {
            return true;
        }

        // Check 2: subject contains our outbound email markers
        String subject = message.getSubject();
        if (subject != null && !subject.isEmpty()) {
            String subjectLower = subject.toLowerCase();
            return subjectLower.contains("[sp:")
                || subjectLower.contains("[pwa:")
                || subjectLower.contains("additional information required")
                || subjectLower.contains("permit package");
        }

        return false;
    }

    /**
     * Detects PWA fallback submission emails by [PWA:WR:uuid] or [PWA:JHA:uuid] in subject.
     * Extracts auto-submit link from body, parses base64 data, and calls submission service.
     * Returns true if the message was a PWA submission email (whether successfully processed or duplicate).
     */
    private boolean tryAutoProcessPwaSubmission(GraphEmailMessage message) {
        String subject = message.getSubject();

        Matcher wrMatcher = PWA_WR_PATTERN.matcher(subject);
        if (wrMatcher.find()) {
            String localUuid = wrMatcher.group(1);
            log.info("[EmailPoll] Detected PWA WR fallback email: localUuid={}", localUuid);
            return autoProcessWorkRequest(message, localUuid);
        }

        Matcher jhaMatcher = PWA_JHA_PATTERN.matcher(subject);
        if (jhaMatcher.find()) {
            String localUuid = jhaMatcher.group(1);
            log.info("[EmailPoll] Detected PWA JHA fallback email: localUuid={}", localUuid);
            return autoProcessJha(message, localUuid);
        }

        return false;
    }

    /**
     * Auto-processes a Work Request from a fallback email.
     * Extracts base64-encoded DTO from the auto-submit link in the email body.
     */
    private boolean autoProcessWorkRequest(GraphEmailMessage message, String localUuid) {
        try {
            String base64Data = extractBase64DataFromBody(message.getBodyContent(),
                    "/api/pwa/work-request/submit-from-email?data=");
            if (base64Data == null) {
                log.warn("[EmailPoll] Could not extract WR data from email body for localUuid={}", localUuid);
                return false;
            }

            String json = new String(Base64.getDecoder().decode(base64Data));
            PwaWorkRequestDto dto = objectMapper.readValue(json, PwaWorkRequestDto.class);
            PwaSubmissionResult result = pwaWorkRequestService.submitWorkRequest(dto);

            if ("duplicate".equals(result.getMethod())) {
                log.info("[EmailPoll] WR already processed: localUuid={}, spId={}", localUuid, result.getSharepointId());
            } else {
                log.info("[EmailPoll] WR auto-processed from email: localUuid={}, method={}, spId={}",
                        localUuid, result.getMethod(), result.getSharepointId());
            }
            return true;
        } catch (Exception e) {
            log.error("[EmailPoll] Failed to auto-process WR from email: localUuid={}, error={}",
                    localUuid, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Auto-processes a JHA from a fallback email.
     * Extracts base64-encoded DTO from the auto-submit link in the email body.
     */
    private boolean autoProcessJha(GraphEmailMessage message, String localUuid) {
        try {
            String base64Data = extractBase64DataFromBody(message.getBodyContent(),
                    "/api/pwa/jha/submit-from-email?data=");
            if (base64Data == null) {
                log.warn("[EmailPoll] Could not extract JHA data from email body for localUuid={}", localUuid);
                return false;
            }

            String json = new String(Base64.getDecoder().decode(base64Data));
            PwaJhaDto dto = objectMapper.readValue(json, PwaJhaDto.class);
            PwaSubmissionResult result = pwaJhaService.submitJha(dto);

            if ("duplicate".equals(result.getMethod())) {
                log.info("[EmailPoll] JHA already processed: localUuid={}, spId={}", localUuid, result.getSharepointId());
            } else {
                log.info("[EmailPoll] JHA auto-processed from email: localUuid={}, method={}, spId={}",
                        localUuid, result.getMethod(), result.getSharepointId());
            }
            return true;
        } catch (Exception e) {
            log.error("[EmailPoll] Failed to auto-process JHA from email: localUuid={}, error={}",
                    localUuid, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Extracts the base64-encoded data parameter from an auto-submit link in email body.
     * Looks for the URL pattern containing the given path prefix and extracts the data= value.
     */
    private String extractBase64DataFromBody(String body, String pathPrefix) {
        if (body == null) return null;
        int pathIdx = body.indexOf(pathPrefix);
        if (pathIdx < 0) return null;

        int dataStart = pathIdx + pathPrefix.length();
        // Find the end of the base64 data (whitespace, newline, or end of string)
        int dataEnd = dataStart;
        while (dataEnd < body.length()) {
            char c = body.charAt(dataEnd);
            if (c == '\n' || c == '\r' || c == ' ' || c == '\t' || c == '<') break;
            dataEnd++;
        }
        if (dataEnd <= dataStart) return null;

        return body.substring(dataStart, dataEnd);
    }

    /**
     * Saves matched inbound correspondence to database.
     * Sets linkedSharepointId from the match for dedup-resilient association.
     */
    private void saveInboundCorrespondence(GraphEmailMessage message,
                                           EmailResponseMatcherService.CorrespondenceMatch match) {
        try {
            EmailCorrespondence correspondence = new EmailCorrespondence();
            correspondence.setEntityType(match.getEntityType());
            correspondence.setEntityId(match.getEntityId());
            correspondence.setDirection(EmailCorrespondence.Direction.INBOUND);
            correspondence.setSubject(message.getSubject());
            correspondence.setBodyContent(message.getBodyContent());
            correspondence.setSender(message.getSenderEmail());
            correspondence.setRecipient(monitoredEmail);
            correspondence.setSentDateTime(message.getSentDateTime());
            correspondence.setInternetMessageId(message.getInternetMessageId());
            correspondence.setConversationId(message.getConversationId());
            correspondence.setGraphMessageId(message.getId());
            correspondence.setLinkedSharepointId(match.getSharepointId());
            correspondence.setIsRead(false);  // Inbound starts as unread
            correspondence.setNeedsAttention(false);

            correspondenceRepo.save(correspondence);
            log.info("[EmailPoll] Saved INBOUND correspondence for {} #{} (SP:{}) - Subject: {}",
                match.getEntityType(), match.getEntityId(), match.getSharepointId(), message.getSubject());

        } catch (Exception e) {
            log.error("[EmailPoll] Failed to save correspondence for message: {}", message.getId(), e);
        }
    }

    /**
     * Saves an unmatched inbound email for later retry.
     * Extracts [SP:xxx] from subject if present for partial linking.
     */
    private void saveUnmatchedCorrespondence(GraphEmailMessage message) {
        try {
            EmailCorrespondence correspondence = new EmailCorrespondence();
            correspondence.setEntityType(null);   // unlinked
            correspondence.setEntityId(null);      // unlinked
            correspondence.setDirection(EmailCorrespondence.Direction.INBOUND);
            correspondence.setSubject(message.getSubject());
            correspondence.setBodyContent(message.getBodyContent());
            correspondence.setSender(message.getSenderEmail());
            correspondence.setRecipient(monitoredEmail);
            correspondence.setSentDateTime(message.getSentDateTime());
            correspondence.setInternetMessageId(message.getInternetMessageId());
            correspondence.setConversationId(message.getConversationId());
            correspondence.setGraphMessageId(message.getId());
            correspondence.setIsRead(false);
            correspondence.setNeedsAttention(true);  // flag for attention since unlinked

            // Try to extract sharepointId from subject even if entity match failed
            if (message.getSubject() != null) {
                Matcher spMatcher = SP_PATTERN.matcher(message.getSubject());
                if (spMatcher.find()) {
                    correspondence.setLinkedSharepointId(spMatcher.group(1));
                }
            }

            correspondenceRepo.save(correspondence);
            log.info("[EmailPoll] Saved UNLINKED correspondence for later retry - Subject: {}",
                message.getSubject());
        } catch (Exception e) {
            log.error("[EmailPoll] Failed to save unmatched correspondence: {}", message.getId(), e);
        }
    }

    /**
     * Periodically retry matching unlinked email correspondence.
     * Once outbound records arrive via sync, the matcher can link them.
     */
    @Scheduled(fixedDelay = 300_000, initialDelay = 120_000)  // every 5 min
    public void retryUnlinkedEmails() {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("email.retryUnlinkedEmails")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            List<EmailCorrespondence> unlinked = correspondenceRepo.findByEntityIdIsNull();
            if (unlinked.isEmpty()) return;

            log.info("[EmailPoll] Retrying {} unlinked emails", unlinked.size());
            int matched = 0;

            for (EmailCorrespondence email : unlinked) {
                GraphEmailMessage msg = new GraphEmailMessage();
                msg.setSubject(email.getSubject());
                msg.setInternetMessageId(email.getInternetMessageId());
                msg.setConversationId(email.getConversationId());
                msg.setId(email.getGraphMessageId());
                msg.setSenderEmail(email.getSender());

                Optional<EmailResponseMatcherService.CorrespondenceMatch> matchResult =
                    matcherService.matchEmailToEntity(msg);

                if (matchResult.isPresent()) {
                    EmailResponseMatcherService.CorrespondenceMatch match = matchResult.get();
                    email.setEntityType(match.getEntityType());
                    email.setEntityId(match.getEntityId());
                    email.setLinkedSharepointId(match.getSharepointId());
                    email.setNeedsAttention(false);
                    correspondenceRepo.save(email);
                    matched++;
                    log.info("[EmailPoll] Retry matched email to {} #{} (SP:{}) - Subject: {}",
                        match.getEntityType(), match.getEntityId(), match.getSharepointId(), email.getSubject());
                }
            }

            log.info("email.retry_unlinked.complete total={} matched={} durationMs={}",
                unlinked.size(), matched, System.currentTimeMillis() - start);
        }
    }

    /**
     * Periodically heal orphaned correspondence where entityId points to a
     * deleted/non-existent WR but linkedSharepointId is still valid.
     * Looks up the current canonical WR ID and updates entityId.
     */
    @Scheduled(fixedDelay = 600_000, initialDelay = 180_000)  // every 10 min, 3 min initial delay
    @SuppressWarnings("unchecked")
    public void healOrphanedCorrespondence() {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("email.healOrphanedCorrespondence")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            // Find correspondence with linkedSharepointId where entityId points to a deleted WR
            List<Object[]> orphaned = entityManager.createNativeQuery(
                "SELECT ec.id, ec.linked_sharepoint_id FROM email_correspondence ec " +
                "WHERE ec.linked_sharepoint_id IS NOT NULL AND ec.deleted = false " +
                "AND ec.entity_type = 'WorkRequest' " +
                "AND (ec.entity_id IS NULL OR ec.entity_id NOT IN " +
                "  (SELECT wr.id FROM work_request wr WHERE wr.deleted = false))")
                .getResultList();

            if (orphaned.isEmpty()) return;

            log.info("[EmailPoll] Found {} orphaned correspondence to heal", orphaned.size());
            int healed = 0;

            for (Object[] row : orphaned) {
                Long ecId = ((Number) row[0]).longValue();
                String spId = (String) row[1];

                // Look up current canonical WR for this sharepointId
                List<Number> wrRows = entityManager.createNativeQuery(
                    "SELECT id FROM work_request WHERE sharepoint_id = :spId AND deleted = false ORDER BY id")
                    .setParameter("spId", spId)
                    .getResultList();

                if (!wrRows.isEmpty()) {
                    Long canonicalWrId = wrRows.get(0).longValue();
                    entityManager.createNativeQuery(
                        "UPDATE email_correspondence SET entity_id = :wrId, needs_attention = false " +
                        "WHERE id = :ecId")
                        .setParameter("wrId", canonicalWrId)
                        .setParameter("ecId", ecId)
                        .executeUpdate();
                    healed++;
                    log.info("[EmailPoll] Healed correspondence #{} -> WorkRequest #{} (SP:{})",
                        ecId, canonicalWrId, spId);
                }
            }

            if (healed > 0) {
                log.info("[EmailPoll] Healed {} of {} orphaned correspondence", healed, orphaned.size());
            }
            log.info("email.heal_orphaned.complete orphaned={} healed={} durationMs={}",
                orphaned.size(), healed, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.warn("[EmailPoll] Error during orphaned correspondence healing: {}", e.getMessage());
        }
    }

    /**
     * Manual trigger for email polling (for testing or on-demand refresh).
     * Can be called via REST endpoint.
     */
    public void triggerManualPoll() {
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("email.triggerManualPoll")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("[EmailPoll] Manual poll triggered");
            pollForNewResponses();
        }
    }
}
