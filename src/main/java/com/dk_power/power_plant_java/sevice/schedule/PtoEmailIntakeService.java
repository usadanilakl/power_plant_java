package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.PtoRequestDto;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.email.ApiEmailService;
import com.dk_power.power_plant_java.sevice.users.UserMatchService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Schedule v2 — Phase 4. Hub-only intake of forwarded workforce-system time-off emails. Polls a
 * mailbox, parses each PTO email ({@link PtoEmailParser}), resolves the requester
 * ({@link UserMatchService}), and creates a {@link PtoRequest}. When it can do so <b>confidently</b>
 * (high-confidence user match + parsed dates) and auto-approve is on, the request is APPROVED,
 * coverage is auto-created for the shifts the person was scheduled to work, and notifications go
 * out; otherwise it is staged {@code PENDING_MANUAL_REVIEW} for a human to resolve via
 * {@link #assignUser}/{@link #approve}.
 *
 * <p><b>Safety.</b> The whole loop is gated off by default ({@code schedule.pto.intake.enabled=false})
 * so nothing polls, creates coverage, or emails coworkers until an operator explicitly turns it on
 * after validating the parser against real mail. Dedup is three-tier (email message id →
 * source request id → {@code userId|start|end} hash), so re-forwarding or re-polling the same email
 * never creates duplicates.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PtoEmailIntakeService {

    /** Only auto-approve (auto-move the person + email coworkers) on a very confident name match. */
    private static final double AUTO_MATCH_CONFIDENCE = 0.90;

    private final ApiEmailService apiEmailService;
    private final SyncConfig syncConfig;
    private final PtoRequestRepo ptoRepo;
    private final UserRepo userRepo;
    private final UserMatchService userMatchService;
    private final NgCoverageService coverageService;
    private final ScheduleMaterialisationService materialisation;
    private final PtoNotificationService notificationService;

    @Value("${schedule.pto.intake.enabled:false}")
    private boolean intakeEnabled;
    @Value("${schedule.pto.intake.mailbox:${email.graph.from:}}")
    private String mailbox;
    @Value("${schedule.pto.intake.subject-regex:(?i)(pto|time.?off|vacation|leave request|day off)}")
    private String subjectRegex;
    @Value("${schedule.pto.intake.lookback-days:3}")
    private int lookbackDays;
    @Value("${schedule.pto.auto-approve:true}")
    private boolean autoApprove;

    private Pattern subjectPattern;
    private LocalDateTime lastPollTime;

    @PostConstruct
    void init() {
        subjectPattern = Pattern.compile(subjectRegex);
        lastPollTime = LocalDateTime.now().minusDays(Math.max(1, lookbackDays));
    }

    // ---- scheduled poll -----------------------------------------------------

    /** Poll the intake mailbox for new time-off emails. Hub-only; no-op unless intake is enabled. */
    @Scheduled(fixedDelayString = "${schedule.pto.intake.poll-interval:600000}", initialDelay = 45_000)
    public void poll() {
        if (!intakeEnabled || !syncConfig.isHubMode()) return;
        if (mailbox == null || mailbox.isBlank()) {
            log.warn("[PtoIntake] Enabled but no mailbox configured (schedule.pto.intake.mailbox / email.graph.from)");
            return;
        }
        try {
            List<GraphEmailMessage> messages = apiEmailService.getMessagesSince(mailbox, lastPollTime, 100);
            int approved = 0;
            int staged = 0;
            for (GraphEmailMessage m : messages) {
                Outcome o = ingest(m);
                if (o == Outcome.APPROVED) approved++;
                else if (o == Outcome.STAGED) staged++;
            }
            lastPollTime = LocalDateTime.now();
            if (approved > 0) materialisation.materializeDefaultHorizon();
            if (approved > 0 || staged > 0) {
                log.info("[PtoIntake] Polled {} messages: {} approved, {} staged for review",
                        messages.size(), approved, staged);
            }
        } catch (Exception e) {
            log.error("[PtoIntake] Poll failed", e);
        }
    }

    private enum Outcome { APPROVED, STAGED, SKIPPED }

    /** Parse + persist one message. Returns what happened (for batch accounting). Never throws. */
    Outcome ingest(GraphEmailMessage m) {
        if (m == null) return Outcome.SKIPPED;
        String subject = m.getSubject();
        if (subject == null || !subjectPattern.matcher(subject).find()) return Outcome.SKIPPED;

        String messageId = m.getInternetMessageId() != null ? m.getInternetMessageId() : m.getId();
        if (messageId != null && ptoRepo.existsByEmailMessageId(messageId)) return Outcome.SKIPPED;

        PtoEmailParser.ParsedPto p = PtoEmailParser.parse(subject, m.getBodyContent());
        if (p.isEmpty()) {
            log.debug("[PtoIntake] Subject matched but nothing parsable — skipping: {}", subject);
            return Outcome.SKIPPED;
        }
        if (p.sourceRequestId() != null && ptoRepo.existsBySourceRequestId(p.sourceRequestId())) {
            return Outcome.SKIPPED;
        }

        UserMatchService.Match match = p.hasName() ? userMatchService.match(p.name()) : null;
        User user = match != null ? match.user : null;
        double confidence = match != null ? match.confidence : 0.0;

        String dedupHash = null;
        if (user != null && p.hasDates()) {
            dedupHash = sha256(user.getId() + "|" + p.startDate() + "|" + p.endDate());
            if (dedupHash != null && ptoRepo.existsByDedupHash(dedupHash)) return Outcome.SKIPPED;
        }

        boolean confident = user != null && confidence >= AUTO_MATCH_CONFIDENCE && p.hasDates();
        String status = confident
                ? (autoApprove ? PtoRequest.Status.APPROVED : PtoRequest.Status.PENDING)
                : PtoRequest.Status.PENDING_MANUAL_REVIEW;

        PtoRequest pto = new PtoRequest();
        pto.setUser(user);
        pto.setName(p.name());                 // raw parsed name — audit + triage aid when unresolved
        pto.setStartDate(p.startDate());
        pto.setEndDate(p.endDate());
        pto.setSubmittedVia("EMAIL");
        pto.setEmailMessageId(messageId);
        pto.setSourceRequestId(p.sourceRequestId());
        pto.setDedupHash(dedupHash);
        pto.setStatus(status);
        PtoRequest saved = ptoRepo.save(pto);

        if (PtoRequest.Status.APPROVED.equals(status)) {
            log.info("[PtoIntake] Auto-approved PTO #{} for {} {}..{} (conf {}, src {})",
                    saved.getId(), displayName(user), p.startDate(), p.endDate(),
                    String.format("%.2f", confidence), p.sourceRequestId());
            applyApproval(saved, user);
            return Outcome.APPROVED;
        }
        log.info("[PtoIntake] Staged PTO #{} ({}) for '{}' {}..{} (user={}, conf {})",
                saved.getId(), status, p.name(), p.startDate(), p.endDate(),
                user != null ? user.getId() : null, String.format("%.2f", confidence));
        return Outcome.STAGED;
    }

    // ---- manual resolution (admin) -----------------------------------------

    @Transactional(readOnly = true)
    public List<PtoRequestDto> listByStatus(String status) {
        List<PtoRequest> rows = status == null || status.isBlank()
                ? ptoRepo.findAll() : ptoRepo.findByStatus(status);
        return rows.stream().map(this::toDto).toList();
    }

    /** Map an unresolved ({@code PENDING_MANUAL_REVIEW}) request to a user; does not approve it. */
    @Transactional
    public PtoRequestDto assignUser(Long ptoId, Long userId) {
        PtoRequest pto = ptoRepo.findById(ptoId)
                .orElseThrow(() -> new IllegalArgumentException("PTO not found: " + ptoId));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        pto.setUser(user);
        if (pto.getStartDate() != null && pto.getEndDate() != null) {
            pto.setDedupHash(sha256(user.getId() + "|" + pto.getStartDate() + "|" + pto.getEndDate()));
        }
        return toDto(ptoRepo.save(pto));
    }

    /** Approve a PTO (auto or manual): create coverage, notify, re-materialise. */
    @Transactional
    public PtoRequestDto approve(Long ptoId) {
        PtoRequest pto = ptoRepo.findById(ptoId)
                .orElseThrow(() -> new IllegalArgumentException("PTO not found: " + ptoId));
        if (pto.getUser() == null) {
            throw new IllegalStateException("Assign a user before approving PTO #" + ptoId);
        }
        if (pto.getStartDate() == null || pto.getEndDate() == null) {
            throw new IllegalStateException("PTO #" + ptoId + " is missing start/end dates");
        }
        pto.setStatus(PtoRequest.Status.APPROVED);
        ptoRepo.save(pto);
        applyApproval(pto, pto.getUser());
        materialisation.materializeDefaultHorizon();
        return toDto(pto);
    }

    @Transactional
    public PtoRequestDto reject(Long ptoId) {
        PtoRequest pto = ptoRepo.findById(ptoId)
                .orElseThrow(() -> new IllegalArgumentException("PTO not found: " + ptoId));
        pto.setStatus(PtoRequest.Status.REJECTED);
        return toDto(ptoRepo.save(pto));
    }

    private PtoRequestDto toDto(PtoRequest p) {
        User u = p.getUser();
        return PtoRequestDto.builder()
                .id(p.getId())
                .userId(u != null ? u.getId() : null)
                .userName(u != null ? displayName(u) : null)
                .rawName(p.getName())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .status(p.getStatus())
                .submittedVia(p.getSubmittedVia())
                .sourceRequestId(p.getSourceRequestId())
                .emailMessageId(p.getEmailMessageId())
                .coverageEmailSentAt(p.getCoverageEmailSentAt())
                .build();
    }

    // ---- internals ----------------------------------------------------------

    /** Create coverage for the shifts the person was scheduled to work, then send notifications. */
    private void applyApproval(PtoRequest pto, User user) {
        List<CoverageRequestDto> coverage = createCoverageForPto(pto, user);
        try {
            notificationService.sendRequesterConfirmation(user, pto, coverage);
            notificationService.sendCoverageNeeded(user, pto, coverage);
        } catch (Exception e) {
            log.warn("[PtoIntake] Notifications for PTO #{} failed (non-fatal): {}", pto.getId(), e.getMessage());
        }
        pto.setCoverageEmailSentAt(LocalDateTime.now());
        ptoRepo.save(pto);
    }

    /**
     * Walk the PTO range and, for each contiguous run of days the user was scheduled to work the
     * same shift, create one {@code PTO_COVERAGE} {@link CoverageRequest}. Days the user was off
     * produce no coverage. Reuses {@link NgCoverageService#createCoverage} for the seat/validation
     * rules rather than writing rows directly.
     */
    private List<CoverageRequestDto> createCoverageForPto(PtoRequest pto, User user) {
        List<CoverageRequestDto> created = new ArrayList<>();
        LocalDate start = pto.getStartDate(), end = pto.getEndDate();
        if (user == null || start == null || end == null) return created;

        List<Run> runs = new ArrayList<>();
        Run cur = null;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            String shift = materialisation.scheduledShiftForUser(user.getId(), d);   // DAY | NIGHT | null(off)
            if (shift == null) { cur = null; continue; }
            if (cur != null && cur.shift.equals(shift)) {
                cur.end = d;
            } else {
                cur = new Run(shift, d);
                runs.add(cur);
            }
        }
        for (Run r : runs) {
            CoverageRequestDto dto = CoverageRequestDto.builder()
                    .startDate(r.start)
                    .endDate(r.end)
                    .shift(r.shift)
                    .requiredCount(1)
                    .reason(CoverageRequest.Reason.PTO_COVERAGE)
                    .ptoRequestId(pto.getId())
                    .build();
            try {
                created.add(coverageService.createCoverage(dto));
            } catch (Exception e) {
                log.warn("[PtoIntake] Failed to create coverage {} {}..{} for PTO #{}: {}",
                        r.shift, r.start, r.end, pto.getId(), e.getMessage());
            }
        }
        return created;
    }

    /** A contiguous run of same-shift scheduled days within a PTO range. */
    private static final class Run {
        final String shift;
        final LocalDate start;
        LocalDate end;
        Run(String shift, LocalDate start) { this.shift = shift; this.start = start; this.end = start; }
    }

    private static String sha256(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(h.length * 2);
            for (byte b : h) sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private static String displayName(User u) {
        if (u == null) return "(unresolved)";
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }
}
