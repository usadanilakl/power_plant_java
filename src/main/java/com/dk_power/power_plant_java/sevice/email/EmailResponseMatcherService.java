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
 * Uses multiple strategies (in priority order):
 * 1. In-Reply-To header matching (most reliable — reply to outbound email)
 * 2. Conversation ID matching (thread-based — same email thread)
 * 3. Subject pattern matching via SharePoint ID [SP:xxx] (hub-independent)
 * 4. Subject pattern matching via PWA marker [PWA:WR:uuid] / [PWA:uuid] (pre-SharePoint fallback)
 * 5. Sender email matching to WorkRequest.submitterEmail (only "Pending More Info" WRs)
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
    // Two PWA subject-marker vocabularies exist and both reach this matcher:
    //   [PWA:WR:uuid] / [PWA:JHA:uuid] / [PWA:INST]  — minted by the PWA (ng-ui), see
    //                                                  EmailPollingService.PWA_WR_PATTERN
    //   [PWA:uuid]                                   — minted by NgWorkRequestService
    // Only the WR forms identify a WorkRequest.
    private static final Pattern PWA_WR_PATTERN = Pattern.compile("\\[PWA:WR:([^\\]]+)\\]");
    // Legacy bare form. [^:\]]+ deliberately cannot span a colon, so this never matches
    // a typed marker like [PWA:WR:uuid] — but it DOES match [PWA:INST], hence the UUID check.
    private static final Pattern PWA_LEGACY_PATTERN = Pattern.compile("\\[PWA:([^:\\]]+)\\]");
    private static final Pattern UUID_PATTERN = Pattern.compile(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

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
            // Only use correspondence that is actually linked to an entity.
            // Unlinked records (entityType/entityId null) would propagate null matches
            // and cause the retry loop to "match" emails to null forever.
            Optional<EmailCorrespondence> linked = matches.stream()
                .filter(ec -> ec.getEntityType() != null && ec.getEntityId() != null)
                .findFirst();
            if (linked.isPresent()) {
                EmailCorrespondence original = linked.get();
                log.debug("[EmailMatcher] Matched via In-Reply-To header to {} #{}",
                    original.getEntityType(), original.getEntityId());
                return Optional.of(new CorrespondenceMatch(
                    original.getEntityType(),
                    original.getEntityId(),
                    original.getConversationId(),
                    original.getLinkedSharepointId()
                ));
            }
        }

        // Strategy 2: Match via conversation ID
        if (incomingEmail.getConversationId() != null && !incomingEmail.getConversationId().isEmpty()) {
            List<EmailCorrespondence> matches =
                correspondenceRepo.findByConversationId(incomingEmail.getConversationId());
            Optional<EmailCorrespondence> linked = matches.stream()
                .filter(ec -> ec.getEntityType() != null && ec.getEntityId() != null)
                .findFirst();
            if (linked.isPresent()) {
                EmailCorrespondence original = linked.get();
                log.debug("[EmailMatcher] Matched via conversation ID to {} #{}",
                    original.getEntityType(), original.getEntityId());
                return Optional.of(new CorrespondenceMatch(
                    original.getEntityType(),
                    original.getEntityId(),
                    original.getConversationId(),
                    original.getLinkedSharepointId()
                ));
            }
        }

        // Strategy 3: Match via SharePoint ID in subject — hub-independent
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
                        incomingEmail.getConversationId(),
                        sharepointId
                    ));
                } else {
                    log.warn("[EmailMatcher] SharePoint ID [SP:{}] found in subject but no matching WorkRequest",
                        sharepointId);
                }
            }

            // Strategy 4: Match via PWA UUID in subject — pre-SharePoint fallback
            String pwaUuid = extractWorkRequestLocalUuid(subject);
            if (pwaUuid != null) {
                WorkRequestLookup lookup = findWorkRequestByLocalUuid(pwaUuid);
                if (lookup != null) {
                    log.debug("[EmailMatcher] Matched via PWA UUID [PWA:{}] to WorkRequest #{}",
                        pwaUuid, lookup.entityId);
                    return Optional.of(new CorrespondenceMatch(
                        "WorkRequest",
                        lookup.entityId,
                        incomingEmail.getConversationId(),
                        lookup.sharepointId
                    ));
                } else {
                    log.warn("[EmailMatcher] PWA UUID [PWA:{}] found in subject but no matching WorkRequest",
                        pwaUuid);
                }
            } else if (subject.contains("[PWA:")) {
                // A PWA marker for something this matcher does not link ([PWA:JHA:uuid],
                // [PWA:INST]). Debug, not warn: EmailPollingService.retryUnlinkedEmails re-runs
                // this matcher over every unlinked row every 5 minutes, so warning here repeats
                // forever for mail that can never resolve to a WorkRequest.
                log.debug("[EmailMatcher] Non-WorkRequest PWA marker in subject, skipping lookup: {}",
                    subject);
            }
        }

        // Strategy 5: Match by sender email → WorkRequest.submitterEmail (only "Pending More Info" status)
        String senderEmail = incomingEmail.getSenderEmail();
        if (senderEmail != null && !senderEmail.isEmpty()) {
            WorkRequestLookup lookup = findPendingWorkRequestBySubmitterEmail(senderEmail);
            if (lookup != null) {
                log.debug("[EmailMatcher] Matched via submitter email '{}' to Pending WorkRequest #{}",
                    senderEmail, lookup.entityId);
                return Optional.of(new CorrespondenceMatch(
                    "WorkRequest",
                    lookup.entityId,
                    incomingEmail.getConversationId(),
                    lookup.sharepointId
                ));
            }
        }

        log.debug("[EmailMatcher] Could not match email from '{}' with subject: {}",
            incomingEmail.getSenderEmail(), incomingEmail.getSubject());
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
     * Pull the WorkRequest {@code localUuid} out of a subject's PWA marker, or return
     * {@code null} when the subject has no marker or carries one for something that is not a
     * WorkRequest — {@code [PWA:JHA:uuid]}, {@code [PWA:INST]}.
     *
     * <p>The previous greedy {@code \[PWA:([^\]]+)\]} captured those typed markers verbatim
     * ({@code "JHA:<uuid>"}, {@code "INST"}) and looked each one up as a WorkRequest localUuid,
     * which could never hit. That both spammed the log via the 5-minute unlinked-email retry and
     * silently failed to match genuine {@code [PWA:WR:uuid]} replies (it captured
     * {@code "WR:<uuid>"} rather than the uuid).
     */
    private String extractWorkRequestLocalUuid(String subject) {
        Matcher wrMatcher = PWA_WR_PATTERN.matcher(subject);
        if (wrMatcher.find()) {
            return wrMatcher.group(1);
        }
        // Legacy bare form from NgWorkRequestService. Its shape is indistinguishable from a typed
        // marker such as [PWA:INST], so accept it only when the token is a canonical UUID — which
        // every localUuid is (crypto.randomUUID / UUID.randomUUID).
        Matcher legacyMatcher = PWA_LEGACY_PATTERN.matcher(subject);
        if (legacyMatcher.find() && UUID_PATTERN.matcher(legacyMatcher.group(1)).matches()) {
            return legacyMatcher.group(1);
        }
        return null;
    }

    /**
     * Find WorkRequest by PWA local UUID.
     * Returns both the entity ID and sharepointId (if available).
     */
    @SuppressWarnings("unchecked")
    private WorkRequestLookup findWorkRequestByLocalUuid(String localUuid) {
        try {
            List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT id, sharepoint_id FROM work_request " +
                "WHERE local_uuid = :uuid AND deleted = false ORDER BY id")
                .setParameter("uuid", localUuid)
                .getResultList();
            if (!rows.isEmpty()) {
                Object[] row = rows.get(0);
                Long id = ((Number) row[0]).longValue();
                String spId = (String) row[1];
                return new WorkRequestLookup(id, spId);
            }
        } catch (Exception e) {
            log.warn("[EmailMatcher] Error looking up WorkRequest by localUuid '{}': {}",
                localUuid, e.getMessage());
        }
        return null;
    }

    /**
     * Find "Pending More Info" WorkRequest by submitter email.
     * Narrowed to only WRs where we've explicitly requested a reply.
     */
    @SuppressWarnings("unchecked")
    private WorkRequestLookup findPendingWorkRequestBySubmitterEmail(String senderEmail) {
        try {
            List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT wr.id, wr.sharepoint_id FROM work_request wr " +
                "JOIN val_table v ON wr.permit_status_id = v.id " +
                "WHERE LOWER(wr.submitter_email) = LOWER(:email) AND wr.deleted = false " +
                "AND LOWER(v.name) = 'pending more info' " +
                "ORDER BY wr.id DESC")
                .setParameter("email", senderEmail)
                .getResultList();
            if (!rows.isEmpty()) {
                if (rows.size() > 1) {
                    log.debug("[EmailMatcher] Submitter '{}' has {} pending WorkRequests, matching to most recent",
                        senderEmail, rows.size());
                }
                Object[] row = rows.get(0);
                Long id = ((Number) row[0]).longValue();
                String spId = (String) row[1];
                return new WorkRequestLookup(id, spId);
            }
        } catch (Exception e) {
            log.warn("[EmailMatcher] Error looking up pending WorkRequest by submitterEmail '{}': {}",
                senderEmail, e.getMessage());
        }
        return null;
    }

    /**
     * Internal helper for WR lookups that return both ID and sharepointId.
     */
    @Data
    @AllArgsConstructor
    private static class WorkRequestLookup {
        private Long entityId;
        private String sharepointId;
    }

    /**
     * Result of email matching containing entity details and stable sharepointId.
     */
    @Data
    @AllArgsConstructor
    public static class CorrespondenceMatch {
        private String entityType;
        private Long entityId;
        private String conversationId;
        private String sharepointId;
    }
}
