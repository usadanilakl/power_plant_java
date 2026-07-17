package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A FieldChange keeps its origin-assigned id across persistence, and a locally-emitted one still gets a
 * fresh id. This is the foundation of a stable global change identity: without it, re-delivery can't be
 * an idempotent upsert and the change id can't serve as the conflict comparator's final tiebreak.
 *
 * <p>The first test is RED on the built-in {@code @GeneratedValue(strategy = UUID)} — Hibernate re-mints
 * even when a value is set (verified: got a different UUID back). The custom generator honours it.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:fc-stable-id-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("FieldChange stable global identity")
class FieldChangeStableIdIT {

    @Autowired
    private FieldChangeRepository fieldChangeRepository;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    private static FieldChange sample(String field) {
        FieldChange fc = new FieldChange("LotoPoint", 4242L, field, null, "\"v\"",
                "ORIGIN-MACHINE", "origin-machine", FieldChange.ChangeType.UPDATE);
        fc.setTimestamp(Instant.now());
        return fc;
    }

    @Test
    @DisplayName("a pre-assigned origin id survives save() and is findable by that id")
    void originId_isPreserved() {
        UUID originId = UUID.fromString("11111111-2222-3333-4444-555555555555");
        FieldChange fc = sample("description");
        fc.setId(originId);

        FieldChange saved = fieldChangeRepository.save(fc);

        assertThat(saved.getId())
                .as("Hibernate's default UUID strategy re-mints even a pre-set id; the custom generator must keep it")
                .isEqualTo(originId);
        assertThat(fieldChangeRepository.existsById(originId))
                .as("findable by the origin id — the basis of idempotent re-delivery")
                .isTrue();
    }

    @Test
    @DisplayName("re-delivering the same change (same id) is an idempotent upsert, not a duplicate row")
    void reDelivery_isIdempotent() {
        UUID originId = UUID.randomUUID();
        FieldChange first = sample("specificLocation");
        first.setId(originId);
        fieldChangeRepository.save(first);

        // Same logical change arrives again (e.g. re-sent because a batchmate deferred).
        FieldChange again = sample("specificLocation");
        again.setId(originId);
        again.setReceivedAt(Instant.now());
        fieldChangeRepository.save(again);

        assertThat(fieldChangeRepository.findAll().stream()
                .filter(fc -> originId.equals(fc.getId())).count())
                .as("one logical change = one row, no matter how many times it is delivered")
                .isEqualTo(1);
    }

    @Test
    @DisplayName("a locally-emitted change (no id set) still gets a fresh UUID")
    void localChange_getsFreshId() {
        FieldChange fc = sample("note"); // no setId
        FieldChange saved = fieldChangeRepository.save(fc);
        assertThat(saved.getId()).as("local emission path unchanged").isNotNull();
    }
}
