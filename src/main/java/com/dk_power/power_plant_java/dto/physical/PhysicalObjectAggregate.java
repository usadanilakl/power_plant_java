package com.dk_power.power_plant_java.dto.physical;

import java.util.List;

/**
 * "Everything about a physical object" — the single-call bundle behind the Rounds question-context view and the
 * desktop object binder. Files/LOTO/work-areas/systems/logs are always present; Maximo work-orders/service-requests
 * are best-effort (only when a Maximo key is configured and the node carries an asset/location link).
 */
public record PhysicalObjectAggregate(
        PhysicalObjectDto node,
        List<PhysicalObjectDto> breadcrumb,
        List<LinkedFileRef> files,
        List<LotoPointRef> lotoPoints,
        List<WorkAreaRef> workAreas,
        List<SystemRef> systems,
        List<ObjectLog> logs,
        List<RoundCheckRef> roundChecks,
        MaximoFacet maximo
) {
    public record LinkedFileRef(Long id, String name, String fileNumber, String fileLink, String extension) {}

    public record LotoPointRef(Long id, String tagNumber, String description, String type,
                               String normalPosition, String isolatedPosition, String specificLocation) {}

    public record WorkAreaRef(Long id, String name, String description, String areaType, int lotoCount) {}

    public record SystemRef(Long id, String name) {}

    /** One object log entry (backed by a polymorphic Comment, entityType="PhysicalObject"). */
    public record ObjectLog(Long id, String content, String author, String createdAt, boolean needsAttention) {}

    /** A round check that monitors this object (reverse of RoundQuestion.physicalObjectId) + its live status. */
    public record RoundCheckRef(Long questionId, Long roundId, String roundName, String category, String prompt,
                                String answerType, String unit, Double lowLimit, Double highLimit, String expectedValue,
                                String lastValue, String lastAt, boolean openIssue) {}

    /** Maximo WO/SR for the object's asset/location link. {@code available=false} when no key / no link. */
    public record MaximoFacet(boolean available, String assetnum, String location,
                              List<Object> workOrders, List<Object> serviceRequests) {}
}
