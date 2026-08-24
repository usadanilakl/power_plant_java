package com.dk_power.power_plant_java.enums;

import java.util.List;
import java.util.Set;

/**
 * The work-request status vocabulary, in one place.
 *
 * <p>Status is a {@code Value} row keyed by name rather than an enum, so every writer spells its
 * own literals and every reader guesses which ones matter. That drifted: expiry and SharePoint
 * auto-close both looked for exactly {@code "Active"}, while the PWA update path had started
 * writing {@code "Updated"} and the request-details path {@code "Pending More Info"}. A request in
 * either of those states was invisible to both sweeps — it never expired and never closed, so an
 * edited request from three weeks ago still sat in the operator's queue looking live.
 *
 * <p>{@link #OPEN} is the answer to "is this request still waiting on somebody?". Add new
 * in-flight statuses here, not to the individual sweeps.
 */
public final class WorkRequestStatuses {

    public static final String ACTIVE = "Active";
    public static final String UPDATED = "Updated";
    public static final String PENDING_MORE_INFO = "Pending More Info";
    public static final String PROCESSED = "Processed";
    public static final String CLOSED = "Closed";
    public static final String CANCELLED = "Cancelled";
    public static final String REVOKED = "Revoked";
    public static final String EXPIRED = "Expired";

    /**
     * Statuses meaning "submitted, not yet turned into permits, not withdrawn" — the ones expiry
     * and auto-close must consider. {@code Processed} is deliberately absent: those requests belong
     * to a package now, and the package's own lifecycle governs them.
     */
    public static final List<String> OPEN = List.of(ACTIVE, UPDATED, PENDING_MORE_INFO);

    private static final Set<String> OPEN_LOWER =
            Set.of(ACTIVE.toLowerCase(), UPDATED.toLowerCase(), PENDING_MORE_INFO.toLowerCase());

    private WorkRequestStatuses() {
    }

    /** Is this status one of {@link #OPEN}? Case-insensitive; null is not open. */
    public static boolean isOpen(String status) {
        return status != null && OPEN_LOWER.contains(status.toLowerCase());
    }
}
