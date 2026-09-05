package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Mirrors WO Q&A into the work order's Maximo WOWORKLOG as the system of record. Each question and answer becomes
 * one worklog row tagged {@code [Q&A]}, so the conversation is preserved in Maximo's own maintenance record while
 * the live thread stays in H2 (fast, offline-capable, CRDT-synced).
 *
 * <p>Best-effort by design: a failed append never affects the in-app message (H2 is the live truth) — it's just
 * logged, and the future reconcile sweep is the backstop. Called from a transaction's {@code afterCommit} hook so
 * the mirror fires exactly once per committed message and never for a rolled-back one. Gated on {@code maximo.api-key}
 * (only present on Maximo-configured nodes); callers reach it through an {@code ObjectProvider} so plain
 * messaging (WR/JHA) keeps working on nodes without Maximo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "maximo.api-key")
public class MaximoQaWorklogService {

    private final MaximoWorkOrderAdapter workOrders;
    private final UserRepo userRepo;

    public void writeQuestion(Conversation c, Long authorId, String content, Long messageId) {
        write(c, authorId, content, messageId, false);
    }

    public void writeAnswer(Conversation c, Long authorId, String content, Long messageId) {
        write(c, authorId, content, messageId, true);
    }

    private void write(Conversation c, Long authorId, String content, Long messageId, boolean isAnswer) {
        try {
            String href = resolveHref(c);
            if (href == null || href.isBlank()) {
                log.warn("[QA-Worklog] No Maximo href for WO conversation {} (wonum {}) — worklog skipped",
                        c.getId(), c.getMaximoWonum());
                return;
            }
            String subject = (c.getSubject() != null && !c.getSubject().isBlank()) ? c.getSubject() : "Question";
            String summary = "[Q&A] " + (isAnswer ? "Re: " : "") + subject;
            if (summary.length() > 100) summary = summary.substring(0, 100).trim();   // WORKLOG.DESCRIPTION cap
            String details = authorName(authorId) + (isAnswer ? " answered" : " asked") + ":\n" + content
                    + "\n\n[qa:c" + c.getId() + "/m" + messageId + "]";   // dedup marker for the future reconcile sweep
            workOrders.reportActuals(href, null, summary, details, "CLIENTNOTE");
            log.info("[QA-Worklog] Mirrored [Q&A] to WO {} (conversation {}, message {})",
                    c.getMaximoWonum(), c.getId(), messageId);
        } catch (Exception e) {
            log.warn("[QA-Worklog] Failed to mirror Q&A to Maximo worklog (conversation {}): {}", c.getId(), e.getMessage());
        }
    }

    private String resolveHref(Conversation c) {
        if (c.getMaximoHref() != null && !c.getMaximoHref().isBlank()) return c.getMaximoHref();
        return workOrders.findHrefByWonum(c.getMaximoWonum());
    }

    private String authorName(Long id) {
        if (id == null) return "Someone";
        return userRepo.findById(id).map(u -> {
            if (u.getName() != null && !u.getName().isBlank()) return u.getName();
            String n = ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
            if (!n.isBlank()) return n;
            return (u.getEmail() != null && !u.getEmail().isBlank()) ? u.getEmail() : "Someone";
        }).orElse("Someone");
    }
}
