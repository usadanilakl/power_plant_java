package com.dk_power.power_plant_java.sevice.maximo;

/**
 * Domain events published by field-list write paths so the Maximo bridge can run in
 * an after-commit listener rather than inside the caller's transaction. Motivation:
 *
 * Codex-flagged bug in the earlier design — {@code bridge.submit()} called directly
 * from a {@code @Transactional} caller could not use {@code REQUIRES_NEW} to persist
 * the Maximo record id independently, because the caller's row INSERT was still
 * uncommitted in the suspended parent tx; the new tx couldn't see it and the persist
 * failed, leaving an orphan Maximo record.
 *
 * With after-commit dispatch: the caller's tx commits (row is durable in H2), THEN
 * the listener fires, the bridge calls Maximo, and the bridge's own tx persists the
 * Maximo id safely on the already-committed row.
 *
 * If the caller's tx rolls back, the event is discarded — nothing is sent to Maximo.
 * That's the correct behavior: no local row, no Maximo record.
 *
 * Records carry ONLY the entity id (not the entity itself). The listener re-fetches
 * inside its own tx so it never operates on a detached/stale instance.
 */
public final class MaximoFieldListEvents {
    private MaximoFieldListEvents() {}

    /** Field list submitted — evaluate for Maximo routing (SR or WO). */
    public record Submitted(Long id) {}

    /** Field list soft-deleted — cancel the corresponding Maximo record if present. */
    public record Cancelled(Long id, String reason) {}

    /** Field list status changed — if it matches wo-completion-status, COMP the WO. */
    public record StatusChanged(Long id, String newStatusName, String actor) {}
}
