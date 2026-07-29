package com.dk_power.power_plant_java.dto.feed;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One normalized entry in the desktop "Updates / News" feed. Aggregated from several unrelated
 * domains (work requests, plant conversations, schedule changes) into a single shape the Electron
 * shell can render uniformly. PJM day-ahead items are added client-side (Electron-only data), so
 * they never flow through this DTO.
 *
 * @see com.dk_power.power_plant_java.sevice.angular.feed.FeedAggregationService
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedItemDto {

    /** Stable identity for client-side de-dup + read tracking, e.g. {@code "WORK_REQUEST:123"}. */
    private String id;

    /** {@code WORK_REQUEST | CONVERSATION | SCHEDULE}. Drives the client icon/color/deep-link. */
    private String category;

    /** Source entity simple name, e.g. {@code "WorkRequest"}, {@code "Conversation"}, {@code "ShiftDay"}. */
    private String entityType;

    /** Source entity id. May be a representative id for rolled-up items (e.g. a schedule batch). */
    private Long entityId;

    private String title;

    private String summary;

    /** ISO-8601 local date-time ({@link java.time.LocalDateTime#toString()}). Client sorts + relative-times it. */
    private String timestamp;

    /** {@code NEW | UPDATED}. */
    private String changeType;

    /** Human actor behind the change (submitter, initiator, schedule source…). Nullable. */
    private String actor;

    /** {@code info | warning} — client accent hint. */
    private String severity;
}
