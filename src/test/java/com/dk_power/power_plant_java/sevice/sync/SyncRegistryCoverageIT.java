package com.dk_power.power_plant_java.sevice.sync;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boot-time guard for the field-change sync registry. {@link SyncRegistryValidator} runs at
 * {@code ApplicationReadyEvent} and records every concrete {@code BaseIdEntity} that is missing from
 * {@code EntityTableRegistry} or has no {@code SyncableService} — those types' changes are SILENTLY
 * DROPPED. This is exactly how {@code LotoBypassAudit} slipped through: it was made a BaseIdEntity to
 * sync (per its Javadoc) but never registered, and the gap only surfaced in the production hub log.
 *
 * <p>The specific assertion proves the LotoBypassAudit fix; the global one turns the whole registry into
 * a compile-and-boot contract so the NEXT unregistered entity fails a test instead of silently losing
 * data in production.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:sync-registry-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Sync registry coverage: every syncable entity is registered with a service")
class SyncRegistryCoverageIT {

    @Autowired private SyncRegistryValidator validator;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    @Test
    @DisplayName("LotoBypassAudit is registered with a SyncableService (no longer silently dropped)")
    void lotoBypassAudit_isCovered() {
        assertThat(validator.getGaps())
                .as("LotoBypassAudit must be in EntityTableRegistry + have a SyncableService — its bypass "
                        + "audit rows were being silently dropped on the hub")
                .noneMatch(gap -> gap.contains("LotoBypassAudit"));
    }

    @Test
    @DisplayName("no syncable entity type lacks registry/service coverage")
    void registryHasNoGaps() {
        assertThat(validator.isDegraded())
                .as("sync registry has uncovered entity types (their changes silently drop): %s", validator.getGaps())
                .isFalse();
        assertThat(validator.getGaps()).isEmpty();
    }
}
