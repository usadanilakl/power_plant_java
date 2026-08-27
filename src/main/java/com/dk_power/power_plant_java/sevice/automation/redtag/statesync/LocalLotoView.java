package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Light projection of {@link com.dk_power.power_plant_java.entities.loto.Loto}
 * used only by {@link RedTagStateReconciler} for building the diff plan.
 *
 * <p>Loaded via a JPQL constructor query — see {@code LotoRepo.findAllForReconcile()}.
 * Avoids the heavy {@code @PostLoad} + snapshot / point-set hydration that
 * {@code repo.findAll()} would trigger for a permit that only needs a handful
 * of scalar fields for matching.
 */
@Getter
@AllArgsConstructor
public class LocalLotoView {
    private final Long id;
    private final String permitNumber;
    /** {@code permitStatus.name} — one of Building / Active / Test / Closed, or {@code null}. */
    private final String permitStatusName;
    private final String redTagNum;
    private final Integer boxNumber;
    /** {@code workScope} on the entity — the closest thing to a "job description" locally. */
    private final String workScope;
    private final String lotoRequestor;
}
