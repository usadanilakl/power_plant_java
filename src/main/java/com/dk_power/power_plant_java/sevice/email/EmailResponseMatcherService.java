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
 * 3. Subject pattern matching via SharePoint ID (hub-independent)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailResponseMatcherService {
    private final EmailCorrespondenceRepo correspondenceRepo;
    @PersistenceContext
    private EntityManager entityManager;

    // Pattern for SharePoint-tagged Work Request: [SP:xxx]
    private static final Pattern SP_PATTERN = Pattern.compile("\\[SP:([^\\]]+)\\]");

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

        // Strategy 3: Match via SharePoint ID in subject — hub-independent
        // Subject format: "... [SP:abc123] ..."
        String subject = incomingEmail.getSubject();
        if (subject != null && !subject.isEmpty()) {
            Matcher spMatcher = SP_PATTERN.matcher(subject);
            if (spMatcher.find()) {
                String sharepointId = spMatcher.group(1);
                Long entityId = findWorkRequestBySharepointId(sharepointId);
                if (entityId != null) {
                    log.debug("[EmailMatcher] Matched via SharePoint ID [SP:{}] to WorkRequest #{}",
                        sharepointId, entityId);
                    return Optional.of(new CorrespondenceMatch(
                        "WorkRequest",
                        entityId,
                        incomingEmail.getConversationId()
                    ));
                } else {
                    log.warn("[EmailMatcher] SharePoint ID [SP:{}] found in subject but no matching WorkRequest",
                        sharepointId);
                }
            }
        }

        log.warn("[EmailMatcher] Could not match email with subject: {}", incomingEmail.getSubject());
        return Optional.empty();
    }

    /**
     * Extracts a specific header value from the email.
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
     * Find the active (non-deleted) WorkRequest by sharepointId.
     * Returns the H2 entity ID for correspondence linking.
     */
    @SuppressWarnings("unchecked")
    private Long findWorkRequestBySharepointId(String sharepointId) {
        try {
            List<Number> rows = entityManager.createNativeQuery(
                "SELECT id FROM work_request WHERE sharepoint_id = :spId AND deleted = false ORDER BY id")
                .setParameter("spId", sharepointId)
                .getResultList();
            if (!rows.isEmpty()) {
                return rows.get(0).longValue();
            }
        } catch (Exception e) {
            log.warn("[EmailMatcher] Error looking up WorkRequest by sharepointId '{}': {}",
                sharepointId, e.getMessage());
        }
        return null;
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
