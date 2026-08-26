package com.dk_power.power_plant_java.sevice.sync;

/**
 * One row of a sync-conformance run: the outcome of mutating {@code field} on {@code (entityType, entityId)}
 * and checking whether sync noticed.
 *
 * <ul>
 *   <li>{@code emitted}   — a {@link com.dk_power.power_plant_java.entities.sync.FieldChange} was produced
 *       locally for this field. {@code false} on a non-skipped row IS the defect (an emission gap).</li>
 *   <li>{@code converged} — the hub's copy matched after a forced sync cycle. {@code null} when convergence
 *       was not checked (single-node run / no hub reachable).</li>
 *   <li>{@code skipped}   — not asserted on (unsupported type, forbidden field, no instance, registration gap);
 *       {@code note} says why.</li>
 * </ul>
 */
public record ConformanceResult(
        String entityType,
        Long entityId,
        String field,
        String relationshipType,
        String mutationKind,
        boolean emitted,
        Boolean converged,
        boolean skipped,
        String note) {
}
