package com.dk_power.power_plant_java.entities.etapro.report;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Output of a report execution — split into summary (small, always loaded)
 * and payload (may be large, loaded on demand).
 */
public class ReportResults {

    // ── Summary (stored in summaryJson) ────────────────────────

    @Getter @Setter @NoArgsConstructor
    public static class Summary {
        private int instancesFound;
        private Map<String, Double> aggregations = new LinkedHashMap<>(); // label → value
    }

    // ── Payload (stored in resultPayloadJson) ──────────────────

    @Getter @Setter @NoArgsConstructor
    public static class Payload {
        private List<EventInstance> instances = new ArrayList<>();
    }

    @Getter @Setter @NoArgsConstructor
    public static class EventInstance {
        private int index;
        private LocalDateTime triggerTime;
        private LocalDateTime endTime;
        private long durationSeconds;

        /** Measurement label → computed value. */
        private Map<String, Double> measurements = new LinkedHashMap<>();

        /**
         * Chart-ready time-series slices per point alias.
         * Key = alias, Value = list of (time, value) pairs.
         * Includes context before/after the event window.
         */
        private Map<String, List<TimeSeriesPoint>> chartData = new LinkedHashMap<>();
    }

    @Getter @Setter @NoArgsConstructor
    public static class TimeSeriesPoint {
        private LocalDateTime time;
        private Double value;

        public TimeSeriesPoint(LocalDateTime time, Double value) {
            this.time = time;
            this.value = value;
        }
    }
}
