package com.dk_power.power_plant_java.dto.rounds;

import java.util.List;

/**
 * Wire DTOs for the Rounds perform flow (PWA operator + desktop dashboard). Grouped in one file since they're small
 * and always used together.
 */
public final class RoundPerformDtos {
    private RoundPerformDtos() {}

    /**
     * A round in the operator's "rounds to do" list. {@code myActiveInstanceId} is this user's IN_PROGRESS grab (if any);
     * {@code lastPerformedAt} is the latest submitted instance; {@code due} is true when the cadence window has elapsed.
     */
    public record RoundListItem(Long id, String name, String area, String cadence, String shift, int questionCount,
                                Long myActiveInstanceId, String grabbedBy, String lastPerformedAt, boolean due) {}

    /** An OPEN issue attached to a question, surfaced so the operator sees "known issue since …". */
    public record OpenIssueRef(Long issueId, String openedAt, String openedBy, String firstComment, String lastValue) {}

    /** One question, as presented for performing (limits + any open issue + conditional-display dependency). */
    public record QuestionForPerform(Long id, Integer orderIndex, String prompt, String answerType, Long physicalObjectId,
                                     String tagCode, String unit, Double lowLimit, Double highLimit, String expectedValue,
                                     boolean trackIssues, String choicesJson, String category, OpenIssueRef openIssue,
                                     Long predecessorQuestionId, String showWhenOp, String showWhenValue) {}

    /** A round opened for performing: header + ordered questions + the live instance id. */
    public record RoundPerform(Long id, String name, String area, String cadence, String shift, Long instanceId,
                               List<QuestionForPerform> questions) {}

    /** Result of grabbing a round (creates/returns an IN_PROGRESS instance). */
    public record GrabResult(Long instanceId, Long roundId, String startedAt, boolean alreadyOwned) {}

    /** One answer submitted for a question. */
    public record AnswerInput(Long questionId, String value, Double numericValue, String comment) {}

    /** Submit payload for a round instance. */
    public record SubmitRoundRequest(String shift, String notes, List<AnswerInput> answers) {}

    /** Outcome of a submit — how the out-of-range reconciliation landed. */
    public record SubmitResult(Long instanceId, int answersSaved, int issuesOpened, int issuesResolved,
                               int issuesOngoing, List<String> warnings) {}

    /** An out-of-range issue for the Active Out-of-Range dashboard. */
    public record RoundIssueDto(Long id, Long questionId, Long physicalObjectId, String questionPrompt, String category,
                                String unit, String status, String openedAt, String openedBy, String firstComment,
                                String lastSeenAt, String lastValue, String resolvedAt, String resolvedBy, int commentCount) {}

    /** One comment on an issue. */
    public record IssueCommentDto(Long id, String text, String author, String createdAt) {}

    /** Add-comment / resolve payload. */
    public record IssueCommentRequest(String text) {}

    /** One past reading for a question (native RoundAnswer history / trend). */
    public record AnswerHistory(String answeredAt, String value, Double numericValue, boolean outOfRange, String instanceShift) {}
}
