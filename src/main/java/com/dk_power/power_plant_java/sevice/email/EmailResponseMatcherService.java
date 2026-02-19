package com.dk_power.power_plant_java.sevice.email;

import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for matching incoming emails to entities.
 * Uses multiple strategies:
 * 1. In-Reply-To header matching (most reliable)
 * 2. Conversation ID matching (thread-based)
 * 3. Subject pattern matching (fallback)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailResponseMatcherService {
    private final EmailCorrespondenceRepo correspondenceRepo;
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Matches an incoming email to an entity using multiple strategies.
     *
     * @param incomingEmail The email message to match
     * @return Optional containing match details if found
     */
    public Optional<CorrespondenceMatch> matchEmailToEntity(GraphEmailMessage incomingEmail) {
        if (incomingEmail == null) {
            return Optional.empty();
        }

        // Strategy 1: Match via In-Reply-To header
        String inReplyTo = extractHeader(incomingEmail, "In-Reply-To");
        if (inReplyTo != null && !inReplyTo.isEmpty()) {
            List<EmailCorrespondence> matches = correspondenceRepo.findByInternetMessageId(inReplyTo);
            if (!matches.isEmpty()) {
                EmailCorrespondence original = matches.get(0);
                log.debug("[EmailMatcher] Matched via In-Reply-To header to {} #{}",
                    original.getEntityType(), original.getEntityId());
                return Optional.of(new CorrespondenceMatch(
                    original.getEntityType(),
                    original.getEntityId(),
                    original.getConversationId()
                ));
            }
        }

        // Strategy 2: Match via conversation ID
        if (incomingEmail.getConversationId() != null && !incomingEmail.getConversationId().isEmpty()) {
            List<EmailCorrespondence> matches =
                correspondenceRepo.findByConversationId(incomingEmail.getConversationId());
            if (!matches.isEmpty()) {
                EmailCorrespondence original = matches.get(0);
                log.debug("[EmailMatcher] Matched via conversation ID to {} #{}",
                    original.getEntityType(), original.getEntityId());
                return Optional.of(new CorrespondenceMatch(
                    original.getEntityType(),
                    original.getEntityId(),
                    original.getConversationId()
                ));
            }
        }

        // Strategy 3: Subject pattern matching
        String subject = incomingEmail.getSubject();
        if (subject != null && !subject.isEmpty()) {
            // Pattern for Work Request: "Work Request #123" or "WR #123"
            Pattern wrPattern = Pattern.compile("(?:Work Request|WR)\\s*#(\\d+)", Pattern.CASE_INSENSITIVE);
            Matcher wrMatcher = wrPattern.matcher(subject);
            if (wrMatcher.find()) {
                long entityId = Long.parseLong(wrMatcher.group(1));
                // The ID in the subject may belong to a dedup'd WR — resolve to canonical ID
                entityId = resolveRemappedId("WorkRequest", entityId);
                log.debug("[EmailMatcher] Matched via subject pattern to WorkRequest #{}", entityId);
                return Optional.of(new CorrespondenceMatch(
                    "WorkRequest",
                    entityId,
                    incomingEmail.getConversationId()
                ));
            }

            // Add more patterns for other entity types as needed
            // Example: JHA, LotoPoint, etc.
        }

        log.warn("[EmailMatcher] Could not match email with subject: {}", incomingEmail.getSubject());
        return Optional.empty();
    }

    /**
     * Extracts a specific header value from the email.
     *
     * @param email The email message
     * @param headerName The header name to extract (case-insensitive)
     * @return The header value, or null if not found
     */
    private String extractHeader(GraphEmailMessage email, String headerName) {
        if (email.getHeaders() == null) {
            return null;
        }

        return email.getHeaders().stream()
            .filter(h -> headerName.equalsIgnoreCase(h.getName()))
            .map(GraphEmailMessage.InternetMessageHeader::getValue)
            .findFirst()
            .orElse(null);
    }

    /**
     * Check the dedup_id_remap table for a remapped ID.
     * When a WR is dedup'd (e.g., #2000000127 → #1000000127), the email subject
     * still contains the original ID. This resolves it to the canonical one.
     */
    private long resolveRemappedId(String entityType, long originalId) {
        try {
            @SuppressWarnings("unchecked")
            List<Number> rows = entityManager.createNativeQuery(
                "SELECT remapped_id FROM dedup_id_remap " +
                "WHERE entity_type = :type AND original_id = :origId")
                .setParameter("type", entityType)
                .setParameter("origId", originalId)
                .getResultList();
            if (!rows.isEmpty()) {
                long remapped = rows.get(0).longValue();
                log.info("[EmailMatcher] Resolved dedup remap: {}#{} -> #{}",
                    entityType, originalId, remapped);
                return remapped;
            }
        } catch (Exception e) {
            log.debug("[EmailMatcher] Could not check dedup remap: {}", e.getMessage());
        }
        return originalId;
    }

    /**
     * Result of email matching containing entity details.
     */
    @Data
    @AllArgsConstructor
    public static class CorrespondenceMatch {
        private String entityType;
        private Long entityId;
        private String conversationId;
    }
}
