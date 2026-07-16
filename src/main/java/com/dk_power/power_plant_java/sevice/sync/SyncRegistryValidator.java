package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

/**
 * Startup coverage assertion for the field-change sync registry (Inc 0a — fail-loud).
 *
 * <p>Every concrete {@code BaseIdEntity} subtype emits field-changes via
 * {@link FieldChangeEntityListener}. If a type is missing from {@code EntityTableRegistry} or has
 * no {@code SyncableService} in {@code ServiceFacade}, its inbound changes are silently dropped by
 * {@code FieldSyncService} ("No service found …"). This validator turns that latent, per-type
 * silent-drop into a loud, at-boot signal — the class of bug that lost LotoStandardApprovalEvent,
 * ShiftDay and WorkCategoryProfile.
 *
 * <p>Types annotated {@link LocalOnlyEntity} are intentionally exempt (the single source of truth
 * for the opt-out). Abstract entity bases are skipped (only their concrete subclasses sync).
 *
 * <p><b>Behaviour:</b> always logs the gaps loudly and exposes {@link #isDegraded()} /
 * {@link #getGaps()} for the health endpoint. A hard hub-startup failure is gated behind
 * {@code sync.registry.strict=true} so enabling it does not brick a hub that still has known
 * pre-existing gaps (EspDevice/LedStrip/Role/Diagram/DiagramPlacement/DiagramConnection); flip it
 * to true once those are closed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SyncRegistryValidator {

    private final EntityManager entityManager;
    private final EntityTableRegistry entityTableRegistry;
    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;

    @Value("${sync.registry.strict:false}")
    private boolean strict;

    private volatile boolean degraded = false;
    private volatile List<String> gaps = List.of();

    @EventListener(ApplicationReadyEvent.class)
    public void validate() {
        List<String> problems = new ArrayList<>();
        int checked = 0;

        for (EntityType<?> et : entityManager.getMetamodel().getEntities()) {
            Class<?> java = et.getJavaType();
            if (java == null) continue;
            if (!BaseIdEntity.class.isAssignableFrom(java)) continue;   // only sync-tracked entities
            if (Modifier.isAbstract(java.getModifiers())) continue;      // abstract bases don't sync as themselves
            if (java.isAnnotationPresent(LocalOnlyEntity.class)) continue; // intentional opt-out

            checked++;
            String name = java.getSimpleName();
            boolean registered = entityTableRegistry.isRegistered(name);
            boolean hasService = serviceFacade.getService(name) != null;
            if (!registered || !hasService) {
                problems.add(name + " (registered=" + registered + ", service=" + hasService + ")");
            }
        }

        if (problems.isEmpty()) {
            log.info("sync.registry.validate ok checked={} — every syncable entity is registered with a service", checked);
            this.degraded = false;
            this.gaps = List.of();
            return;
        }

        problems.sort(String::compareTo);
        this.degraded = true;
        this.gaps = List.copyOf(problems);
        String msg = "sync.registry.validate FAILED — " + problems.size() + " syncable entity type(s) "
                + "have no registry/service coverage and their changes will be SILENTLY DROPPED: " + problems
                + ". Fix: add to EntityTableRegistry + a SyncableService in ServiceFacade, or annotate @LocalOnlyEntity.";

        if (syncConfig.isHubMode() && strict) {
            // Fail-fast: the hub must never run with unsynced entity types once strict mode is on.
            throw new IllegalStateException(msg);
        }
        log.error("{} [role={}, strict={}] — running DEGRADED for these types.",
                msg, syncConfig.isHubMode() ? "hub" : "client", strict);
    }

    /** True if any syncable entity type lacks registry/service coverage (health surfacing). */
    public boolean isDegraded() {
        return degraded;
    }

    /** The uncovered entity types (each as "Name (registered=…, service=…)"). */
    public List<String> getGaps() {
        return gaps;
    }
}
