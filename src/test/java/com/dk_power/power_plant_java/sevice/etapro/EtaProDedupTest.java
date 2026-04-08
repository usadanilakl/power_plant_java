package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that {@link EtaProReadingRepo#existsByPointIdAndReadingTime(String, LocalDateTime)}
 * works correctly against H2. This is the key query used by the scraper to skip duplicate
 * readings on overlapping scrape windows.
 *
 * Uses {@link DataJpaTest} with a nested {@link Config} class so we bypass
 * {@code PowerPlantJavaApplication} which pulls in SikuliX and other heavy beans
 * that don't work in headless test mode. Nested config classes are NOT picked up
 * by {@code @ComponentScan}, so this won't conflict with full {@code @SpringBootTest}
 * runs of other test classes.
 */
@DataJpaTest
@AutoConfigureTestDatabase
@ContextConfiguration(classes = EtaProDedupTest.Config.class)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        // Let schema.sql run AFTER Hibernate creates tables — it adds the id_seq
        // needed by DevicePrefixedIdGenerator
        "spring.jpa.defer-datasource-initialization=true",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:schema.sql",
        "spring.sql.init.continue-on-error=true",
        "spring.flyway.enabled=false"
})
class EtaProDedupTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
    @EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository.etapro")
    static class Config {}

    @Autowired
    private EtaProReadingRepo readingRepo;

    @AfterEach
    void cleanUp() {
        readingRepo.deleteAll();
    }

    @Test
    void existsByPointIdAndReadingTime_returnsFalse_whenEmpty() {
        assertThat(readingRepo.existsByPointIdAndReadingTime("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 0))).isFalse();
    }

    @Test
    void existsByPointIdAndReadingTime_returnsTrue_afterInsert() {
        LocalDateTime ts = LocalDateTime.of(2026, 4, 8, 10, 0);
        EtaProReading r = newReading("1GT1.MW", ts, 150.5);
        readingRepo.save(r);

        assertThat(readingRepo.existsByPointIdAndReadingTime("1GT1.MW", ts)).isTrue();
    }

    @Test
    void existsByPointIdAndReadingTime_discriminatesByPointId() {
        LocalDateTime ts = LocalDateTime.of(2026, 4, 8, 10, 0);
        readingRepo.save(newReading("1GT1.MW", ts, 150.5));

        // Same timestamp but different point — should be false
        assertThat(readingRepo.existsByPointIdAndReadingTime("1HRSG.PRESS", ts)).isFalse();
    }

    @Test
    void existsByPointIdAndReadingTime_discriminatesByTimestamp() {
        readingRepo.save(newReading("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 0), 150.5));

        // Same point but different timestamp — should be false
        assertThat(readingRepo.existsByPointIdAndReadingTime("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 1))).isFalse();
    }

    /**
     * Simulates an overlapping scrape scenario: scrape A imports readings, then scrape B
     * runs shortly after and sees some of the same timestamps. The second run should
     * skip those while still importing newer readings.
     */
    @Test
    void overlappingScrapes_onlyNewReadingsSurvive() {
        // First scrape — import 3 readings
        readingRepo.save(newReading("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 0), 150.0));
        readingRepo.save(newReading("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 1), 150.5));
        readingRepo.save(newReading("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 2), 151.0));

        // Second scrape — includes the last 2 (overlap) plus 2 new readings
        LocalDateTime[] incoming = {
                LocalDateTime.of(2026, 4, 8, 10, 1),  // duplicate — should skip
                LocalDateTime.of(2026, 4, 8, 10, 2),  // duplicate — should skip
                LocalDateTime.of(2026, 4, 8, 10, 3),  // new
                LocalDateTime.of(2026, 4, 8, 10, 4)   // new
        };

        int imported = 0;
        for (LocalDateTime ts : incoming) {
            if (!readingRepo.existsByPointIdAndReadingTime("1GT1.MW", ts)) {
                readingRepo.save(newReading("1GT1.MW", ts, 152.0));
                imported++;
            }
        }

        assertThat(imported).isEqualTo(2);
        assertThat(readingRepo.count()).isEqualTo(5); // 3 original + 2 new, no duplicates
    }

    @Test
    void scrapeSessionIdIsPreserved() {
        EtaProReading r = newReading("1GT1.MW", LocalDateTime.of(2026, 4, 8, 10, 0), 150.0);
        r.setScrapeSessionId("session-abc");
        readingRepo.save(r);

        assertThat(readingRepo.findByScrapeSessionId("session-abc")).hasSize(1);
        assertThat(readingRepo.countByScrapeSessionId("session-abc")).isEqualTo(1);
    }

    private EtaProReading newReading(String pointId, LocalDateTime ts, double value) {
        EtaProReading r = new EtaProReading();
        r.setPointId(pointId);
        r.setReadingTime(ts);
        r.setReadingValue(value);
        r.setQuality("Good");
        r.setScrapeSessionId("test-session");
        return r;
    }
}
