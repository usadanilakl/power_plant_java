package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression for the hub M2M clobber: the hub's incoming accept-gate ({@code shouldAcceptChange}) did
 * whole-field LWW with NO OR-Set bypass, so a CONCURRENT older owning-{@code @ManyToMany} membership edit
 * was dropped ({@code skipped=1}) before it ever reached the per-element apply. Observed live: two nodes
 * each add a different point to the same {@code Equipment.lotoPoints}; the hub kept its own newer add and
 * silently rejected the client's older one, so that point never converged onto the hub.
 *
 * <p>The gate only reads {@code membershipOrsetEnabled} and its arguments, so it is exercised directly via
 * the Lombok all-args constructor (unused deps null) — no Spring context, no hub profile.
 */
@DisplayName("Hub accept-gate OR-Set bypass")
class HubSyncServiceAcceptGateTest {

    private HubSyncService newService(boolean orsetEnabled) {
        // @RequiredArgsConstructor arg order = final field declaration order (10 deps); the two inline-
        // initialized final fields and the @Value flag are NOT constructor params.
        HubSyncService svc = new HubSyncService(null, null, null, null, null, null, null, null, null, null);
        ReflectionTestUtils.setField(svc, "membershipOrsetEnabled", orsetEnabled);
        return svc;
    }

    private FieldChange change(String type, Long id, String field, String rel, Instant ts) {
        FieldChange c = new FieldChange(type, id, field, "[]", "[1]", "ORIGIN", "Origin", FieldChange.ChangeType.UPDATE);
        c.setRelationshipType(rel);
        c.setTimestamp(ts);
        c.setId(UUID.randomUUID());
        return c;
    }

    private boolean accept(HubSyncService svc, FieldChange incoming, FieldChange latest) {
        Map<String, FieldChange> latestMap = new HashMap<>();
        if (latest != null) {
            latestMap.put(latest.getEntityType() + ":" + latest.getEntityId() + ":" + latest.getFieldName(), latest);
        }
        return Boolean.TRUE.equals(ReflectionTestUtils.invokeMethod(svc, "shouldAcceptChange", incoming, latestMap));
    }

    @Test
    @DisplayName("OR-Set on: an OLDER concurrent @ManyToMany membership change is ACCEPTED (per-element merge does the real resolution)")
    void orsetOn_olderManyToManyAccepted() {
        HubSyncService svc = newService(true);
        Instant t1 = Instant.parse("2026-08-08T08:21:42.995Z"); // client's add (older)
        Instant t2 = Instant.parse("2026-08-08T08:21:43.054Z"); // hub's own add (newer, already latest)
        FieldChange incoming = change("Equipment", 2000089026L, "lotoPoints", "ManyToMany", t1);
        FieldChange latest = change("Equipment", 2000089026L, "lotoPoints", "ManyToMany", t2);
        assertThat(accept(svc, incoming, latest))
                .as("older concurrent membership add must not be dropped at the hub accept-gate")
                .isTrue();
    }

    @Test
    @DisplayName("OR-Set OFF: the same older @ManyToMany change is still gated by whole-field LWW (loses)")
    void orsetOff_olderManyToManyRejected() {
        HubSyncService svc = newService(false);
        Instant t1 = Instant.parse("2026-08-08T08:21:42.995Z");
        Instant t2 = Instant.parse("2026-08-08T08:21:43.054Z");
        FieldChange incoming = change("Equipment", 2000089026L, "lotoPoints", "ManyToMany", t1);
        FieldChange latest = change("Equipment", 2000089026L, "lotoPoints", "ManyToMany", t2);
        assertThat(accept(svc, incoming, latest)).isFalse();
    }

    @Test
    @DisplayName("OR-Set on: a NON-membership (scalar) older change is STILL gated by whole-field LWW (the bypass is M2M-only)")
    void orsetOn_olderScalarStillGated() {
        HubSyncService svc = newService(true);
        Instant t1 = Instant.parse("2026-08-08T08:21:42.995Z");
        Instant t2 = Instant.parse("2026-08-08T08:21:43.054Z");
        FieldChange incoming = change("Equipment", 2000089026L, "description", null, t1);
        FieldChange latest = change("Equipment", 2000089026L, "description", null, t2);
        assertThat(accept(svc, incoming, latest)).isFalse();
    }

    @Test
    @DisplayName("No prior change on the field → accepted regardless (nothing to lose to)")
    void noLatest_accepted() {
        HubSyncService svc = newService(true);
        FieldChange incoming = change("Equipment", 2000089026L, "lotoPoints", "ManyToMany",
                Instant.parse("2026-08-08T08:21:42.995Z"));
        assertThat(accept(svc, incoming, null)).isTrue();
    }
}
