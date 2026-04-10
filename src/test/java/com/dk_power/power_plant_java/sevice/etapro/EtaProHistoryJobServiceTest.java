package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests for the batch-planning logic in {@link EtaProHistoryJobService}.
 * No Spring context needed — tests only the stateless helpers.
 */
class EtaProHistoryJobServiceTest {

    // ── computeTotalBatches ───────────────────────────────────

    @Test
    void computesOneBatchFor5PointsOneDay() {
        int n = EtaProHistoryJobService.computeTotalBatches(5,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(n).isEqualTo(1);
    }

    @Test
    void computesOneBatchForExactly20Points() {
        int n = EtaProHistoryJobService.computeTotalBatches(20,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(n).isEqualTo(1);
    }

    @Test
    void splits21PointsIntoTwoGroups() {
        int n = EtaProHistoryJobService.computeTotalBatches(21,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 2, 0, 0));
        // 21/20 = 2 point groups × 1 day = 2 batches
        assertThat(n).isEqualTo(2);
    }

    @Test
    void computesBatchesFor7DayWindow() {
        int n = EtaProHistoryJobService.computeTotalBatches(10,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 8, 0, 0));
        // 10 points (1 group) × 7 days = 7 batches
        assertThat(n).isEqualTo(7);
    }

    @Test
    void computesBatchesForMultiGroupMultiDay() {
        int n = EtaProHistoryJobService.computeTotalBatches(25,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 4, 0, 0));
        // 25 points → 2 groups (20 + 5); 3 days; 2 × 3 = 6 batches
        assertThat(n).isEqualTo(6);
    }

    @Test
    void subDayRangeCountsAsOneDay() {
        int n = EtaProHistoryJobService.computeTotalBatches(1,
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 1, 1, 0));  // 1 hour range
        assertThat(n).isEqualTo(1);
    }

    // ── computeDaySlices ──────────────────────────────────────

    @Test
    void daySlicesForExactly24Hours() {
        int n = EtaProHistoryJobService.computeDaySlices(
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(n).isEqualTo(1);
    }

    @Test
    void daySlicesRoundsUpPartialDay() {
        int n = EtaProHistoryJobService.computeDaySlices(
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 4, 2, 12, 0));  // 36 hours
        assertThat(n).isEqualTo(2);
    }

    // ── chunkPoints ───────────────────────────────────────────

    @Test
    void chunkPointsReturnsSingleChunkForSmallList() {
        List<List<String>> chunks = EtaProHistoryJobService.chunkPoints(
                List.of("P1", "P2", "P3"), 20);
        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).containsExactly("P1", "P2", "P3");
    }

    @Test
    void chunkPointsSplitsAt20() {
        List<String> points = new java.util.ArrayList<>();
        for (int i = 1; i <= 25; i++) points.add("P" + i);

        List<List<String>> chunks = EtaProHistoryJobService.chunkPoints(points, 20);
        assertThat(chunks).hasSize(2);
        assertThat(chunks.get(0)).hasSize(20);
        assertThat(chunks.get(1)).hasSize(5);
        assertThat(chunks.get(1)).containsExactly("P21", "P22", "P23", "P24", "P25");
    }

    @Test
    void chunkPointsSplitsAt100ForLive() {
        List<String> points = new java.util.ArrayList<>();
        for (int i = 1; i <= 150; i++) points.add("P" + i);

        List<List<String>> chunks = EtaProHistoryJobService.chunkPoints(points, 100);
        assertThat(chunks).hasSize(2);
        assertThat(chunks.get(0)).hasSize(100);
        assertThat(chunks.get(1)).hasSize(50);
    }

    // ── planBatches ───────────────────────────────────────────

    @Test
    void planBatchesGeneratesDayByDaySlicesForSinglePointGroup() {
        EtaProHistoryJobService svc = new EtaProHistoryJobService(null);

        EtaProScrapeJob job = new EtaProScrapeJob();
        job.setPointIds(List.of("P1", "P2"));
        job.setRangeStart(LocalDateTime.of(2026, 4, 1, 0, 0));
        job.setRangeEnd(LocalDateTime.of(2026, 4, 4, 0, 0));

        List<EtaProHistoryJobService.BatchPlan> plan = svc.planBatches(job);

        assertThat(plan).hasSize(3);
        assertThat(plan.get(0).start()).isEqualTo(LocalDateTime.of(2026, 4, 1, 0, 0));
        assertThat(plan.get(0).end()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(plan.get(1).start()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(plan.get(1).end()).isEqualTo(LocalDateTime.of(2026, 4, 3, 0, 0));
        assertThat(plan.get(2).start()).isEqualTo(LocalDateTime.of(2026, 4, 3, 0, 0));
        assertThat(plan.get(2).end()).isEqualTo(LocalDateTime.of(2026, 4, 4, 0, 0));

        // All batches contain all points (single group)
        for (EtaProHistoryJobService.BatchPlan b : plan) {
            assertThat(b.pointIds()).containsExactly("P1", "P2");
        }
    }

    @Test
    void planBatchesInterleavesPointGroupsWithinEachDay() {
        EtaProHistoryJobService svc = new EtaProHistoryJobService(null);

        List<String> points = new java.util.ArrayList<>();
        for (int i = 1; i <= 25; i++) points.add("P" + i);

        EtaProScrapeJob job = new EtaProScrapeJob();
        job.setPointIds(points);
        job.setRangeStart(LocalDateTime.of(2026, 4, 1, 0, 0));
        job.setRangeEnd(LocalDateTime.of(2026, 4, 3, 0, 0));

        List<EtaProHistoryJobService.BatchPlan> plan = svc.planBatches(job);

        // 2 groups × 2 days = 4 batches
        assertThat(plan).hasSize(4);

        // Order: day1-group1, day1-group2, day2-group1, day2-group2
        assertThat(plan.get(0).start()).isEqualTo(LocalDateTime.of(2026, 4, 1, 0, 0));
        assertThat(plan.get(0).pointIds()).hasSize(20);
        assertThat(plan.get(1).start()).isEqualTo(LocalDateTime.of(2026, 4, 1, 0, 0));
        assertThat(plan.get(1).pointIds()).hasSize(5);
        assertThat(plan.get(2).start()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(plan.get(2).pointIds()).hasSize(20);
        assertThat(plan.get(3).start()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(plan.get(3).pointIds()).hasSize(5);
    }

    @Test
    void planBatchesTruncatesLastSliceToRangeEnd() {
        EtaProHistoryJobService svc = new EtaProHistoryJobService(null);

        EtaProScrapeJob job = new EtaProScrapeJob();
        job.setPointIds(List.of("P1"));
        job.setRangeStart(LocalDateTime.of(2026, 4, 1, 0, 0));
        job.setRangeEnd(LocalDateTime.of(2026, 4, 2, 12, 0));  // 36 hours

        List<EtaProHistoryJobService.BatchPlan> plan = svc.planBatches(job);

        assertThat(plan).hasSize(2);
        assertThat(plan.get(0).end()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        // Second batch is truncated to the actual rangeEnd
        assertThat(plan.get(1).start()).isEqualTo(LocalDateTime.of(2026, 4, 2, 0, 0));
        assertThat(plan.get(1).end()).isEqualTo(LocalDateTime.of(2026, 4, 2, 12, 0));
    }
}
