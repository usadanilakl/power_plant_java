package com.dk_power.power_plant_java.sevice.email;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    @Lazy private final CentralSyncService centralSyncService;

    @Value("${email.graph.from}")
    private String monitoredEmail;

    private LocalDateTime lastPollTime = LocalDateTime.now().minusDays(7);

    /**
     * Scheduled task to poll for new email responses.
     * Runs every 10 minutes by default (configurable via email.poll.interval).
     * When hub is online, only hub polls — clients receive data via sync.
     * When hub is offline, clients poll for themselves (offline capability preserved).
     */
    @Scheduled(fixedDelayString = "${email.poll.interval:600000}") // 10 minutes default
    public void pollForNewResponses() {
        if (!syncConfig.isHubMode() && centralSyncService.isServerAvailable()) return;
        try {
            log.info("[EmailPoll] Checking for emails since {}", lastPollTime);

            List<GraphEmailMessage> newMessages =
                apiEmailService.getMessagesSince(monitoredEmail, lastPollTime, 100);

            log.info("[EmailPoll] Found {} new messages", newMessages.size());

            for (GraphEmailMessage message : newMessages) {
                processIncomingMessage(message);
            }

            lastPollTime = LocalDateTime.now();

        } catch (Exception e) {
            log.error("[EmailPoll] Error during polling", e);
        }
    }

    /**
     * Processes a single incoming email message.
     * Checks for duplicates, matches to entity, and saves if matched.
     *
     * @param message The incoming email message from Graph API
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
     * Saves matched inbound correspondence to database.
     *
     * @param message The email message
     * @param match The matched entity details
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
            correspondence.setIsRead(false);  // Inbound starts as unread
            correspondence.setNeedsAttention(false);

            correspondenceRepo.save(correspondence);
            log.info("[EmailPoll] Saved INBOUND correspondence for {} #{} - Subject: {}",
                match.getEntityType(), match.getEntityId(), message.getSubject());

        } catch (Exception e) {
            log.error("[EmailPoll] Failed to save correspondence for message: {}", message.getId(), e);
        }
    }

    /**
     * Saves an unmatched inbound email for later retry.
     * The outbound record it replies to may not have synced yet — once sync
     * delivers it, the retry scheduler will match and link the email.
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
        List<EmailCorrespondence> unlinked = correspondenceRepo.findByEntityIdIsNull();
        if (unlinked.isEmpty()) return;

        log.info("[EmailPoll] Retrying {} unlinked emails", unlinked.size());
        int matched = 0;

        for (EmailCorrespondence email : unlinked) {
            // Build a lightweight GraphEmailMessage for the matcher
            GraphEmailMessage msg = new GraphEmailMessage();
            msg.setSubject(email.getSubject());
            msg.setInternetMessageId(email.getInternetMessageId());
            msg.setConversationId(email.getConversationId());
            msg.setId(email.getGraphMessageId());

            Optional<EmailResponseMatcherService.CorrespondenceMatch> match =
                matcherService.matchEmailToEntity(msg);

            if (match.isPresent()) {
                email.setEntityType(match.get().getEntityType());
                email.setEntityId(match.get().getEntityId());
                email.setNeedsAttention(false);
                correspondenceRepo.save(email);
                matched++;
                log.info("[EmailPoll] Retry matched email to {} #{} - Subject: {}",
                    match.get().getEntityType(), match.get().getEntityId(), email.getSubject());
            }
        }

        if (matched > 0) {
            log.info("[EmailPoll] Retry matched {} of {} unlinked emails", matched, unlinked.size());
        }
    }

    /**
     * Manual trigger for email polling (for testing or on-demand refresh).
     * Can be called via REST endpoint.
     */
    public void triggerManualPoll() {
        log.info("[EmailPoll] Manual poll triggered");
        pollForNewResponses();
    }
}
