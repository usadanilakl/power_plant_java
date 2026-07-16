package com.dk_power.power_plant_java.sevice.sync;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a {@code BaseIdEntity} subtype that is intentionally NOT synced across the cluster.
 * Such entities inherit {@link FieldChangeEntityListener} but must be excluded from BOTH
 * change tracking and the {@link SyncRegistryValidator} coverage assertion.
 *
 * <p>This is the single source of truth for the local-only opt-out — it replaces the
 * hardcoded {@code FieldChangeEntityListener.LOCAL_ONLY_ENTITIES} set so the listener and
 * the validator can never disagree about which types are exempt.
 *
 * <p>{@code @Inherited} so a Hibernate proxy (a runtime subclass of the entity) still reports
 * the annotation when the listener inspects {@code entity.getClass()}.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface LocalOnlyEntity {
    /** Why this entity is local-only (e.g. "high-frequency per-node ESP work queue"). */
    String reason() default "";
}
