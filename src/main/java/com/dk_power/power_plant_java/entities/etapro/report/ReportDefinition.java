package com.dk_power.power_plant_java.entities.etapro.report;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Root of the report template definition — serialized to JSON and stored
 * in {@code EtaProReport.definitionJson}.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReportDefinition {

    /** Named bindings: alias → EtaPro point ID. */
    private List<PointBinding> points = new ArrayList<>();

    /** How to detect events (the "trigger"). */
    private EventDetectorConfig trigger;

    /** What to measure in each detected event window. */
    private List<MeasurementConfig> measurements = new ArrayList<>();

    /** Summary stats across all found instances. */
    private List<AggregationConfig> aggregations = new ArrayList<>();

    // ── Nested types ──────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor
    public static class PointBinding {
        private String alias;     // e.g., "speed"
        private String pointId;   // e.g., "GT1.SPEED"
        private String unit;      // e.g., "RPM"
    }

    @Getter @Setter @NoArgsConstructor
    public static class EventDetectorConfig {
        private EventType type;
        /** Alias of the anchor point — events are detected on this series. */
        private String anchorAlias;
        private ThresholdCrossingConfig thresholdCrossing;
        // Future: patternSequence, valueHold
    }

    public enum EventType { THRESHOLD_CROSSING, PATTERN_SEQUENCE, VALUE_HOLD }

    @Getter @Setter @NoArgsConstructor
    public static class ThresholdCrossingConfig {
        private double threshold;
        private Direction direction;        // FALLING_BELOW, RISING_ABOVE

        /** Optional: require the value was at/near this before crossing. */
        private Double fromValue;
        /** Tolerance around fromValue (e.g., ±50 RPM). */
        private Double fromTolerance;

        // ── Event stability controls ──────────────────────────
        /** Arm threshold: value must be >= this before a FALLING_BELOW event arms. */
        private Double armThreshold;
        /** Hysteresis: once crossed, value must move at least this far past threshold to register. */
        private Double hysteresis;
        /** Hold duration (seconds): value must stay past threshold for this long. */
        private Double holdDurationSeconds;
        /** Minimum gap (seconds) between consecutive events — prevents re-triggering. */
        private Double minGapBetweenEventsSeconds;
        /** Quality policy: SKIP_BAD (default) or INCLUDE_BAD. */
        private QualityPolicy qualityPolicy;
    }

    public enum Direction { FALLING_BELOW, RISING_ABOVE }
    public enum QualityPolicy { SKIP_BAD, INCLUDE_BAD }

    @Getter @Setter @NoArgsConstructor
    public static class MeasurementConfig {
        private String label;               // e.g., "Cool-down duration"
        private MeasurementType type;

        // For DURATION: start condition + end condition
        private String startPointAlias;
        private Comparator startComparator;
        private double startValue;

        private String endPointAlias;
        private Comparator endComparator;
        private double endValue;

        // For VALUE_AT_EVENT, MIN_VALUE, MAX_VALUE, AVG_VALUE, DELTA:
        private String targetPointAlias;

        /** How far (seconds) after the trigger to look for end condition. */
        private Double maxWindowSeconds;
    }

    public enum MeasurementType {
        DURATION,       // time between start and end conditions
        VALUE_AT_EVENT, // value of target point at trigger time
        MIN_VALUE,      // min of target in event window
        MAX_VALUE,      // max of target in event window
        AVG_VALUE,      // average in event window
        DELTA           // change from start to end of window
    }

    public enum Comparator { GT, GTE, LT, LTE, EQ, NEQ, BETWEEN }

    @Getter @Setter @NoArgsConstructor
    public static class AggregationConfig {
        private String label;               // e.g., "Average cool-down"
        private AggregationType type;
        private String measurementLabel;    // which measurement to aggregate
    }

    public enum AggregationType { AVG, MIN, MAX, COUNT, STDDEV }
}
