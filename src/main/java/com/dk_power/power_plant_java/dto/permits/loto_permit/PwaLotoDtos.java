package com.dk_power.power_plant_java.dto.permits.loto_permit;

import java.util.List;

/**
 * Wire DTOs for the mobile (PWA) LOTO permit hang / verify / walkdown flows. Grouped here since they are small and
 * always used together. Phases: "HANG", "VERIFY", "WALKDOWN".
 */
public final class PwaLotoDtos {
    private PwaLotoDtos() {}

    /** Who currently holds a phase (advisory grab). */
    public record GrabInfo(String phase, String by, String byName, String at) {}

    /**
     * A permit in the operator's "ready to …" list, with the phases it currently qualifies for + who's on it.
     * {@code verifyBlockedForMe} = separation-of-duty: this user hung every still-unverified point, so they cannot
     * verify any of them (the list shows it read-only rather than letting them work and fail at submit).
     */
    public record PwaLotoListItem(Long id, String permitNumber, String requestor, String equipmentSystem, String status,
                                  Integer boxNumber, String redTagNum,
                                  List<String> phases, GrabInfo hangGrab, GrabInfo verifyGrab, int walkdownSessions,
                                  int pointCount, int hungCount, int verifiedCount, boolean verifyBlockedForMe) {}

    /**
     * One point as presented on the hang/verify/walkdown screens (positions resolve client-side via /positions).
     * {@code canVerify} is false when the CURRENT user hung this point (hanger≠verifier) — the UI must disable the
     * Mark-verified control up front and show {@code verifyBlockedReason}, not reject it at submit.
     */
    public record PwaLotoPoint(Long id, Integer orderIndex, String tagNumber, String description,
                               Long isoPosId, String isolatedPosition, Long normPosId, String normalPosition,
                               String zeroEnergyMethod, String specificLocation, String generalLocation,
                               Boolean lockable, Boolean tagged,
                               List<Long> installPredecessors, List<String> installSafetyConditions,
                               String hungBy, String hungAt, String verifiedBy, String verifiedAt,
                               boolean canVerify, String verifyBlockedReason) {}

    /** A permit opened for a flow: header + points + live phase state + who holds each phase. */
    public record PwaLotoDetail(Long id, String permitNumber, String requestor, String equipmentSystem, String status,
                                boolean caApproved, boolean allHung, boolean allVerified, List<String> phases,
                                GrabInfo hangGrab, GrabInfo verifyGrab, boolean canVerifyAny, List<PwaLotoPoint> points) {}

    /** One point's acknowledgements + note, for hang or verify. */
    public record PointAck(Long pointId, List<String> acknowledged, String notes) {}

    /** Batch hang submit (points sent in predecessor order; server re-enforces). */
    public record HangSubmitRequest(List<PointAck> points, boolean signHung, String hungNotes) {}

    /** Batch verify submit (any order; server enforces all-hung + hanger≠verifier + safety ack). */
    public record VerifySubmitRequest(List<PointAck> points, boolean signVerified, String verifiedNotes) {}

    /** Outcome of a hang/verify batch. */
    public record PhaseSubmitResult(int applied, int skipped, List<String> failures,
                                    boolean aggregateSigned, String aggregateMessage) {}

    // ── walkdown (repeatable WalkdownSession) ──
    public record WalkdownStartRequest(String crewName, String notes) {}
    public record PointCheck(Long pointId, boolean checked, String notes) {}
    public record WalkdownSubmitRequest(List<PointCheck> points, boolean complete, String notes) {}
    public record PwaWalkdownPointState(Long pointId, boolean checked, String checkedBy, String checkedAt, String notes) {}
    public record PwaWalkdownSession(Long id, Long lotoId, String crewName, String startedBy, String startedAt,
                                     boolean completed, String completedBy, String completedAt,
                                     List<PwaWalkdownPointState> points) {}
}
