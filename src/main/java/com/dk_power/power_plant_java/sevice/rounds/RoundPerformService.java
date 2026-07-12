package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.dto.rounds.RoundPerformDtos.*;
import com.dk_power.power_plant_java.entities.rounds.*;
import com.dk_power.power_plant_java.repository.rounds.*;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The Rounds perform flow: list active rounds, grab (create an IN_PROGRESS {@link RoundInstance}), submit answers with
 * out-of-range {@link RoundIssue} reconciliation, and drive the Active Out-of-Range dashboard. Shared by the PWA
 * ({@code PwaRoundsController}) and desktop.
 *
 * <p><b>Issue reconciliation (on submit only, per design):</b> an out-of-range answer attaches to the question's OPEN
 * issue if one exists (comment optional), else opens a new one (comment REQUIRED). A back-in-range answer auto-RESOLVES
 * an OPEN issue. A later re-occurrence opens a fresh issue (new required comment). Persistent issues therefore need one
 * comment, not one per round.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoundPerformService {

    private final RoundRepository roundRepo;
    private final RoundQuestionRepository questionRepo;
    private final RoundInstanceRepository instanceRepo;
    private final RoundAnswerRepository answerRepo;
    private final RoundIssueRepository issueRepo;

    // ── list / open ──

    @Transactional(readOnly = true)
    public List<RoundListItem> listActiveRounds() {
        String me = currentUser();
        LocalDateTime now = LocalDateTime.now();
        return roundRepo.findByActiveTrueAndDeletedFalseOrderByNameAsc().stream().map(r -> {
            int qc = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(r.getId()).size();
            RoundInstance mine = firstInProgress(r.getId(), me);
            RoundInstance any = mine != null ? mine : firstInProgressAny(r.getId());
            RoundInstance last = instanceRepo.findFirstByRoundIdAndStatusOrderBySubmittedAtDesc(r.getId(), RoundInstanceStatus.SUBMITTED);
            LocalDateTime lastAt = last == null ? null : last.getSubmittedAt();
            boolean due = lastAt == null || lastAt.plusHours(cadenceHours(r)).isBefore(now);
            return new RoundListItem(r.getId(), r.getName(), r.getArea(),
                    r.getCadence() == null ? null : r.getCadence().name(),
                    r.getShift() == null ? null : r.getShift().name(), qc,
                    mine == null ? null : mine.getId(),
                    any == null ? null : any.getPerformedBy(),
                    str(lastAt), due);
        }).toList();
    }

    /** Cadence window in hours (drives the "due" flag). CUSTOM uses intervalHours; falls back to daily. */
    private long cadenceHours(Round r) {
        if (r.getCadence() != null) {
            switch (r.getCadence()) {
                case PER_SHIFT: return 12;
                case DAILY: return 24;
                case WEEKLY: return 24 * 7;
                case MONTHLY: return 24 * 30;
                case CUSTOM: return r.getIntervalHours() != null && r.getIntervalHours() > 0 ? r.getIntervalHours() : 24;
            }
        }
        return r.getIntervalHours() != null && r.getIntervalHours() > 0 ? r.getIntervalHours() : 24;
    }

    @Transactional(readOnly = true)
    public RoundPerform getRoundForPerform(Long roundId) {
        Round r = roundRepo.findById(roundId).filter(x -> !x.isDeleted()).orElse(null);
        if (r == null) return null;
        RoundInstance mine = firstInProgress(roundId, currentUser());
        List<QuestionForPerform> qs = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(roundId).stream()
                .map(this::toPerform).toList();
        return new RoundPerform(r.getId(), r.getName(), r.getArea(),
                r.getCadence() == null ? null : r.getCadence().name(),
                r.getShift() == null ? null : r.getShift().name(),
                mine == null ? null : mine.getId(), qs);
    }

    // ── grab ──

    @Transactional
    public GrabResult grab(Long roundId, String shift) {
        Round r = roundRepo.findById(roundId).filter(x -> !x.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Round not found: " + roundId));
        String me = currentUser();
        RoundInstance existing = firstInProgress(roundId, me);
        if (existing != null) {
            return new GrabResult(existing.getId(), roundId, str(existing.getStartedAt()), true);
        }
        RoundInstance inst = new RoundInstance();
        inst.setRoundId(roundId);
        inst.setRoundName(r.getName());
        inst.setPerformedBy(me);
        inst.setStartedAt(LocalDateTime.now());
        inst.setStatus(RoundInstanceStatus.IN_PROGRESS);
        inst.setShift(shift);
        inst = instanceRepo.save(inst);
        return new GrabResult(inst.getId(), roundId, str(inst.getStartedAt()), false);
    }

    // ── submit ──

    @Transactional
    public SubmitResult submit(Long instanceId, SubmitRoundRequest req) {
        RoundInstance inst = instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));
        if (inst.getStatus() == RoundInstanceStatus.SUBMITTED)
            throw new IllegalStateException("Round already submitted");
        String me = currentUser();
        List<AnswerInput> answers = req == null || req.answers() == null ? List.of() : req.answers();

        Map<Long, RoundQuestion> qById = questionRepo.findByRound_IdAndDeletedFalseOrderByOrderIndexAsc(inst.getRoundId())
                .stream().collect(Collectors.toMap(RoundQuestion::getId, Function.identity()));

        // 1. validate: a NEW out-of-range answer must carry a comment (existing issue → comment optional).
        List<String> missingComment = new ArrayList<>();
        for (AnswerInput a : answers) {
            RoundQuestion q = qById.get(a.questionId());
            if (q == null || !q.isTrackIssues()) continue;
            if (computeOutOfRange(q, a.value(), a.numericValue())
                    && issueRepo.findFirstByQuestionIdAndStatus(q.getId(), RoundIssueStatus.OPEN) == null
                    && blank(a.comment())) {
                missingComment.add(q.getPrompt() != null ? q.getPrompt() : ("#" + q.getId()));
            }
        }
        if (!missingComment.isEmpty())
            throw new IllegalArgumentException("A comment is required for new out-of-range readings: " + String.join("; ", missingComment));

        // 2. persist answers + reconcile issues
        int opened = 0, resolved = 0, ongoing = 0, saved = 0;
        List<String> warnings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (AnswerInput a : answers) {
            RoundQuestion q = qById.get(a.questionId());
            if (q == null) { warnings.add("Unknown question " + a.questionId() + " skipped"); continue; }
            boolean oor = computeOutOfRange(q, a.value(), a.numericValue());

            RoundAnswer ans = new RoundAnswer();
            ans.setInstance(inst);
            ans.setQuestionId(q.getId());
            ans.setValue(a.value());
            ans.setNumericValue(a.numericValue() != null ? a.numericValue() : parseNum(a.value()));
            ans.setOutOfRange(oor);
            ans.setComment(a.comment());
            ans.setAnsweredAt(now);

            if (q.isTrackIssues()) {
                RoundIssue open = issueRepo.findFirstByQuestionIdAndStatus(q.getId(), RoundIssueStatus.OPEN);
                if (oor) {
                    if (open != null) {
                        open.setLastSeenAt(now);
                        open.setLastValue(a.value());
                        if (!blank(a.comment())) addComment(open, a.comment(), me, now, instanceId);
                        issueRepo.save(open);
                        ans.setIssueId(open.getId());
                        ongoing++;
                    } else {
                        RoundIssue issue = new RoundIssue();
                        issue.setQuestionId(q.getId());
                        issue.setPhysicalObjectId(q.getPhysicalObjectId());
                        issue.setQuestionPrompt(q.getPrompt());
                        issue.setCategory(q.getCategory());
                        issue.setUnit(q.getUnit());
                        issue.setStatus(RoundIssueStatus.OPEN);
                        issue.setOpenedAt(now);
                        issue.setOpenedBy(me);
                        issue.setOpeningInstanceId(instanceId);
                        issue.setFirstComment(a.comment());
                        issue.setLastSeenAt(now);
                        issue.setLastValue(a.value());
                        issue = issueRepo.save(issue);
                        ans.setIssueId(issue.getId());
                        opened++;
                    }
                } else if (open != null) {
                    open.setStatus(RoundIssueStatus.RESOLVED);
                    open.setResolvedAt(now);
                    open.setResolvedBy(me);
                    open.setResolvingInstanceId(instanceId);
                    open.setLastSeenAt(now);
                    open.setLastValue(a.value());
                    if (!blank(a.comment())) addComment(open, a.comment(), me, now, instanceId);
                    issueRepo.save(open);
                    resolved++;
                }
            }
            answerRepo.save(ans);
            saved++;
        }

        inst.setStatus(RoundInstanceStatus.SUBMITTED);
        inst.setSubmittedAt(now);
        if (req != null && req.shift() != null) inst.setShift(req.shift());
        if (req != null && req.notes() != null) inst.setNotes(req.notes());
        instanceRepo.save(inst);

        return new SubmitResult(instanceId, saved, opened, resolved, ongoing, warnings);
    }

    // ── Active Out-of-Range dashboard ──

    @Transactional(readOnly = true)
    public List<RoundIssueDto> listIssues(boolean openOnly) {
        List<RoundIssue> issues = new ArrayList<>(issueRepo.findByStatusOrderByOpenedAtDesc(RoundIssueStatus.OPEN));
        if (!openOnly) issues.addAll(issueRepo.findByStatusOrderByOpenedAtDesc(RoundIssueStatus.RESOLVED));
        return issues.stream().map(this::toIssueDto).toList();
    }

    @Transactional(readOnly = true)
    public List<IssueCommentDto> issueComments(Long issueId) {
        RoundIssue issue = issueRepo.findById(issueId).orElse(null);
        if (issue == null || issue.getComments() == null) return List.of();
        return issue.getComments().stream()
                .sorted((x, y) -> nullsafe(x.getCreatedAt()).compareTo(nullsafe(y.getCreatedAt())))
                .map(c -> new IssueCommentDto(c.getId(), c.getText(), c.getAuthor(), str(c.getCreatedAt())))
                .toList();
    }

    @Transactional
    public IssueCommentDto commentIssue(Long issueId, String text) {
        RoundIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));
        if (blank(text)) throw new IllegalArgumentException("Comment text required");
        RoundIssueComment c = addComment(issue, text.trim(), currentUser(), LocalDateTime.now(), null);
        issueRepo.save(issue);
        return new IssueCommentDto(c.getId(), c.getText(), c.getAuthor(), str(c.getCreatedAt()));
    }

    /** Recent readings for a question (native answer history — the trend). Newest first, capped. */
    @Transactional(readOnly = true)
    public List<AnswerHistory> questionHistory(Long questionId, int limit) {
        return answerRepo.findByQuestionIdOrderByAnsweredAtDesc(questionId).stream()
                .limit(Math.max(1, limit))
                .map(a -> new AnswerHistory(str(a.getAnsweredAt()), a.getValue(), a.getNumericValue(), a.isOutOfRange(),
                        a.getInstance() == null ? null : a.getInstance().getShift()))
                .toList();
    }

    @Transactional
    public RoundIssueDto resolveIssue(Long issueId, String text) {
        RoundIssue issue = issueRepo.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));
        LocalDateTime now = LocalDateTime.now();
        issue.setStatus(RoundIssueStatus.RESOLVED);
        issue.setResolvedAt(now);
        issue.setResolvedBy(currentUser());
        if (!blank(text)) addComment(issue, text.trim(), currentUser(), now, null);
        return toIssueDto(issueRepo.save(issue));
    }

    // ── helpers ──

    private RoundIssueComment addComment(RoundIssue issue, String text, String author, LocalDateTime at, Long instanceId) {
        RoundIssueComment c = new RoundIssueComment();
        c.setIssue(issue);
        c.setText(text);
        c.setAuthor(author);
        c.setCreatedAt(at);
        c.setInstanceId(instanceId);
        if (issue.getComments() == null) issue.setComments(new ArrayList<>());
        issue.getComments().add(c); // cascade = ALL on RoundIssue.comments
        return c;
    }

    /** Whether an answer violates the question's abnormal-condition criterion (ignores trackIssues). */
    private boolean computeOutOfRange(RoundQuestion q, String value, Double numericValue) {
        RoundAnswerType t = q.getAnswerType();
        if (t == RoundAnswerType.READING) {
            Double n = numericValue != null ? numericValue : parseNum(value);
            if (n == null) return false;
            if (q.getLowLimit() != null && n < q.getLowLimit()) return true;
            return q.getHighLimit() != null && n > q.getHighLimit();
        }
        String exp = q.getExpectedValue();
        if (exp != null && !exp.isBlank()) {
            return value == null || !exp.trim().equalsIgnoreCase(value.trim());
        }
        return false;
    }

    private QuestionForPerform toPerform(RoundQuestion q) {
        OpenIssueRef ref = null;
        if (q.isTrackIssues()) {
            RoundIssue open = issueRepo.findFirstByQuestionIdAndStatus(q.getId(), RoundIssueStatus.OPEN);
            if (open != null) ref = new OpenIssueRef(open.getId(), str(open.getOpenedAt()), open.getOpenedBy(),
                    open.getFirstComment(), open.getLastValue());
        }
        return new QuestionForPerform(q.getId(), q.getOrderIndex(), q.getPrompt(),
                q.getAnswerType() == null ? null : q.getAnswerType().name(), q.getPhysicalObjectId(), q.getTagCode(),
                q.getUnit(), q.getLowLimit(), q.getHighLimit(), q.getExpectedValue(), q.isTrackIssues(),
                q.getChoicesJson(), q.getCategory(), ref,
                q.getPredecessorQuestionId(), q.getShowWhenOp(), q.getShowWhenValue());
    }

    private RoundIssueDto toIssueDto(RoundIssue i) {
        int cc = i.getComments() == null ? 0 : i.getComments().size();
        return new RoundIssueDto(i.getId(), i.getQuestionId(), i.getPhysicalObjectId(), i.getQuestionPrompt(),
                i.getCategory(), i.getUnit(), i.getStatus() == null ? null : i.getStatus().name(),
                str(i.getOpenedAt()), i.getOpenedBy(), i.getFirstComment(), str(i.getLastSeenAt()), i.getLastValue(),
                str(i.getResolvedAt()), i.getResolvedBy(), cc);
    }

    private RoundInstance firstInProgress(Long roundId, String user) {
        if (user == null) return null;
        return instanceRepo.findByPerformedByAndStatus(user, RoundInstanceStatus.IN_PROGRESS).stream()
                .filter(i -> roundId.equals(i.getRoundId()))
                .findFirst().orElse(null);
    }

    private RoundInstance firstInProgressAny(Long roundId) {
        return instanceRepo.findByStatus(RoundInstanceStatus.IN_PROGRESS).stream()
                .filter(i -> roundId.equals(i.getRoundId()))
                .findFirst().orElse(null);
    }

    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            String n = cud.getName();
            return (n != null && !n.isBlank()) ? n : cud.getUsername();
        }
        return auth.getName();
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }
    private static String str(LocalDateTime t) { return t == null ? null : t.toString(); }
    private static LocalDateTime nullsafe(LocalDateTime t) { return t == null ? LocalDateTime.MIN : t; }

    private static Double parseNum(String s) {
        if (s == null) return null;
        try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return null; }
    }
}
