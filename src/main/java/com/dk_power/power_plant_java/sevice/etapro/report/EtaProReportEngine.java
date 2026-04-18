package com.dk_power.power_plant_java.sevice.etapro.report;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.entities.etapro.report.ReportDefinition;
import com.dk_power.power_plant_java.entities.etapro.report.ReportDefinition.*;
import com.dk_power.power_plant_java.entities.etapro.report.ReportParams;
import com.dk_power.power_plant_java.entities.etapro.report.ReportResults;
import com.dk_power.power_plant_java.entities.etapro.report.ReportResults.*;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Executes a report definition against the reading database.
 *
 * <p>Phases:
 * <ol>
 *   <li>Event detection — find trigger events using the configured detector</li>
 *   <li>Measurement — for each event, compute requested metrics</li>
 *   <li>Chart slicing — extract time-series around each event</li>
 *   <li>Aggregation — summary stats across all instances</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProReportEngine {

    private final EtaProReadingRepo readingRepo;
    private final ThresholdCrossingDetector thresholdDetector = new ThresholdCrossingDetector();

    public record ExecutionResult(Summary summary, Payload payload) {}

    /**
     * Run a report to completion.
     *
     * @param definition parsed report definition
     * @param params     runtime parameters
     * @return summary + payload
     */
    public ExecutionResult execute(ReportDefinition definition, ReportParams params) {
        // Resolve point aliases → pointIds
        Map<String, String> aliasToPointId = new HashMap<>();
        for (PointBinding pb : definition.getPoints()) {
            aliasToPointId.put(pb.getAlias(), pb.getPointId());
        }

        // Determine search window
        LocalDateTime searchFrom = params.getSearchFrom() != null
                ? params.getSearchFrom() : LocalDateTime.now().minusYears(1);
        LocalDateTime searchTo = params.getSearchTo() != null
                ? params.getSearchTo() : LocalDateTime.now();

        // Phase 1: Event detection
        EventDetectorConfig trigger = definition.getTrigger();
        String anchorPointId = aliasToPointId.get(trigger.getAnchorAlias());
        if (anchorPointId == null) {
            throw new IllegalArgumentException("Anchor alias '" + trigger.getAnchorAlias() + "' not found in point bindings");
        }

        log.info("[Report] Loading anchor readings for {} ({} to {})", anchorPointId, searchFrom, searchTo);
        List<EtaProReading> anchorReadings = readingRepo.findByPointIdAndReadingTimeBetweenOrderByReadingTimeAsc(
                anchorPointId, searchFrom, searchTo);
        log.info("[Report] Loaded {} anchor readings", anchorReadings.size());

        List<ThresholdCrossingDetector.DetectedEvent> detectedEvents;
        if (trigger.getType() == EventType.THRESHOLD_CROSSING) {
            detectedEvents = thresholdDetector.detect(
                    anchorReadings,
                    trigger.getThresholdCrossing(),
                    params.getMaxInstances(),
                    params.isSearchBackwards()
            );
        } else {
            throw new UnsupportedOperationException("Detector type not yet implemented: " + trigger.getType());
        }

        if (detectedEvents.isEmpty()) {
            Summary summary = new Summary();
            summary.setInstancesFound(0);
            return new ExecutionResult(summary, new Payload());
        }

        // Phase 2+3: Measurement + chart slicing per event
        List<EventInstance> instances = new ArrayList<>();
        int idx = 0;
        for (ThresholdCrossingDetector.DetectedEvent de : detectedEvents) {
            EventInstance instance = processEvent(
                    idx++, de, definition, params, aliasToPointId, anchorReadings);
            instances.add(instance);
        }

        // Phase 4: Aggregation
        Summary summary = computeAggregations(instances, definition.getAggregations());
        summary.setInstancesFound(instances.size());

        Payload payload = new Payload();
        payload.setInstances(instances);

        log.info("[Report] Execution complete: {} instances, {} aggregations",
                instances.size(), summary.getAggregations().size());

        return new ExecutionResult(summary, payload);
    }

    // ── Phase 2+3: per-event processing ───────────────────────

    private EventInstance processEvent(int index,
                                       ThresholdCrossingDetector.DetectedEvent de,
                                       ReportDefinition definition,
                                       ReportParams params,
                                       Map<String, String> aliasToPointId,
                                       List<EtaProReading> anchorReadings) {
        EventInstance instance = new EventInstance();
        instance.setIndex(index);
        instance.setTriggerTime(de.getTriggerTime());

        // Find event end time from measurements (first DURATION measurement's end condition)
        LocalDateTime endTime = de.getTriggerTime();
        double maxWindowSec = 3600; // default 1 hour max

        for (MeasurementConfig mc : definition.getMeasurements()) {
            if (mc.getMaxWindowSeconds() != null) {
                maxWindowSec = Math.max(maxWindowSec, mc.getMaxWindowSeconds());
            }

            if (mc.getType() == MeasurementType.DURATION) {
                LocalDateTime windowEnd = de.getTriggerTime().plusSeconds((long) maxWindowSec);

                // Phase 2a: find the actual start time from the start condition
                // (may differ from trigger time if startPointAlias/condition is configured)
                LocalDateTime measureStart = de.getTriggerTime();
                if (mc.getStartPointAlias() != null && mc.getStartComparator() != null) {
                    String startPointId = aliasToPointId.get(mc.getStartPointAlias());
                    if (startPointId != null) {
                        List<EtaProReading> startReadings = getReadingsForAlias(
                                startPointId, aliasToPointId, definition, anchorReadings,
                                de.getTriggerTime(), windowEnd);
                        LocalDateTime startMet = findConditionTime(startReadings, mc.getStartComparator(), mc.getStartValue());
                        if (startMet != null) {
                            measureStart = startMet;
                        }
                    }
                }

                // Phase 2b: find when end condition is met
                String endPointId = aliasToPointId.get(mc.getEndPointAlias());
                if (endPointId == null) {
                    log.warn("[Report] End point alias '{}' not found in bindings, skipping measurement '{}'",
                            mc.getEndPointAlias(), mc.getLabel());
                    instance.getMeasurements().put(mc.getLabel(), null);
                    continue;
                }

                List<EtaProReading> endReadings = getReadingsForAlias(
                        endPointId, aliasToPointId, definition, anchorReadings,
                        measureStart, windowEnd);

                LocalDateTime conditionMet = findConditionTime(endReadings, mc.getEndComparator(), mc.getEndValue());
                if (conditionMet != null) {
                    endTime = conditionMet;
                    long durationSec = Duration.between(measureStart, conditionMet).getSeconds();
                    instance.getMeasurements().put(mc.getLabel(), (double) durationSec);
                    instance.setDurationSeconds(durationSec);
                } else {
                    instance.getMeasurements().put(mc.getLabel(), null);
                }
            }
            // Future: VALUE_AT_EVENT, MIN_VALUE, MAX_VALUE, AVG_VALUE, DELTA
        }

        instance.setEndTime(endTime);

        // Phase 3: chart slices — include context before/after
        LocalDateTime chartStart = de.getTriggerTime().minusSeconds(params.getContextBeforeSeconds());
        LocalDateTime chartEnd = endTime.plusSeconds(params.getContextAfterSeconds());

        for (PointBinding pb : definition.getPoints()) {
            String pointId = aliasToPointId.get(pb.getAlias());
            List<EtaProReading> chartReadings;
            if (pointId.equals(aliasToPointId.get(definition.getTrigger().getAnchorAlias()))) {
                chartReadings = filterReadingsInRange(anchorReadings, chartStart, chartEnd);
            } else {
                chartReadings = readingRepo.findByPointIdAndReadingTimeBetweenOrderByReadingTimeAsc(
                        pointId, chartStart, chartEnd);
            }

            List<TimeSeriesPoint> tsPoints = chartReadings.stream()
                    .filter(r -> r.getReadingValue() != null)
                    .map(r -> new TimeSeriesPoint(r.getReadingTime(), r.getReadingValue()))
                    .toList();
            instance.getChartData().put(pb.getAlias(), tsPoints);
        }

        return instance;
    }

    // ── Phase 4: aggregation ──────────────────────────────────

    private Summary computeAggregations(List<EventInstance> instances, List<AggregationConfig> configs) {
        Summary summary = new Summary();

        if (configs == null || configs.isEmpty()) return summary;

        for (AggregationConfig ac : configs) {
            List<Double> values = instances.stream()
                    .map(i -> i.getMeasurements().get(ac.getMeasurementLabel()))
                    .filter(Objects::nonNull)
                    .toList();

            if (values.isEmpty()) {
                summary.getAggregations().put(ac.getLabel(), null);
                continue;
            }

            double result = switch (ac.getType()) {
                case AVG -> values.stream().mapToDouble(d -> d).average().orElse(0);
                case MIN -> values.stream().mapToDouble(d -> d).min().orElse(0);
                case MAX -> values.stream().mapToDouble(d -> d).max().orElse(0);
                case COUNT -> (double) values.size();
                case STDDEV -> {
                    double avg = values.stream().mapToDouble(d -> d).average().orElse(0);
                    double variance = values.stream().mapToDouble(d -> (d - avg) * (d - avg)).average().orElse(0);
                    yield Math.sqrt(variance);
                }
            };

            summary.getAggregations().put(ac.getLabel(), result);
        }

        return summary;
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Get readings for a point, using the anchor cache if it's the anchor point,
     * otherwise querying the DB. Avoids duplicate DB hits for the anchor series.
     */
    private List<EtaProReading> getReadingsForAlias(String pointId,
                                                     Map<String, String> aliasToPointId,
                                                     ReportDefinition definition,
                                                     List<EtaProReading> anchorReadings,
                                                     LocalDateTime start, LocalDateTime end) {
        String anchorPointId = aliasToPointId.get(definition.getTrigger().getAnchorAlias());
        if (pointId.equals(anchorPointId)) {
            return filterReadingsInRange(anchorReadings, start, end);
        } else {
            return readingRepo.findByPointIdAndReadingTimeBetweenOrderByReadingTimeAsc(pointId, start, end);
        }
    }

    private List<EtaProReading> filterReadingsInRange(List<EtaProReading> readings,
                                                       LocalDateTime start, LocalDateTime end) {
        return readings.stream()
                .filter(r -> !r.getReadingTime().isBefore(start) && !r.getReadingTime().isAfter(end))
                .toList();
    }

    private LocalDateTime findConditionTime(List<EtaProReading> readings,
                                             ReportDefinition.Comparator comparator, double value) {
        for (EtaProReading r : readings) {
            if (r.getReadingValue() == null) continue;
            double v = r.getReadingValue();
            boolean met = switch (comparator) {
                case GT -> v > value;
                case GTE -> v >= value;
                case LT -> v < value;
                case LTE -> v <= value;
                case EQ -> v == value;
                case NEQ -> v != value;
                case BETWEEN -> false; // not applicable for single-value condition
            };
            if (met) return r.getReadingTime();
        }
        return null;
    }
}
