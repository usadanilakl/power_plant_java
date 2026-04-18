package com.dk_power.power_plant_java.sevice.etapro.report;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.entities.etapro.report.ReportDefinition.*;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Detects events where a point's value crosses a threshold.
 *
 * <p>Supports: direction (falling/rising), arm threshold, hysteresis,
 * hold duration, minimum gap between events, and quality filtering.
 *
 * <p>Returns a list of {@link DetectedEvent} with trigger timestamp only —
 * measurements and chart data are computed separately by the engine.
 */
@Slf4j
public class ThresholdCrossingDetector {

    @Getter
    public static class DetectedEvent {
        private final LocalDateTime triggerTime;
        private final double triggerValue;

        public DetectedEvent(LocalDateTime triggerTime, double triggerValue) {
            this.triggerTime = triggerTime;
            this.triggerValue = triggerValue;
        }
    }

    /**
     * Scan readings for threshold crossings.
     *
     * @param readings       sorted by readingTime ASC
     * @param config         threshold crossing configuration
     * @param maxInstances   stop after finding this many
     * @param searchBackwards if true, return the most recent N events
     * @return detected events (newest first if searchBackwards)
     */
    public List<DetectedEvent> detect(List<EtaProReading> readings,
                                      ThresholdCrossingConfig config,
                                      int maxInstances,
                                      boolean searchBackwards) {
        if (readings == null || readings.isEmpty() || config == null) {
            return Collections.emptyList();
        }

        double threshold = config.getThreshold();
        Direction direction = config.getDirection();
        QualityPolicy qualityPolicy = config.getQualityPolicy() != null
                ? config.getQualityPolicy() : QualityPolicy.SKIP_BAD;
        double hysteresis = config.getHysteresis() != null ? config.getHysteresis() : 0;
        Double armThreshold = config.getArmThreshold();
        Double holdDurationSec = config.getHoldDurationSeconds();
        double minGapSec = config.getMinGapBetweenEventsSeconds() != null
                ? config.getMinGapBetweenEventsSeconds() : 0;

        List<DetectedEvent> events = new ArrayList<>();
        boolean armed = (armThreshold == null); // if no arm threshold, always armed
        LocalDateTime lastEventTime = null;
        boolean wasPastThreshold = false;
        LocalDateTime crossingStartTime = null;

        for (EtaProReading r : readings) {
            if (r.getReadingValue() == null) continue;
            if (qualityPolicy == QualityPolicy.SKIP_BAD && "Bad".equalsIgnoreCase(r.getQuality())) continue;

            double value = r.getReadingValue();
            LocalDateTime time = r.getReadingTime();

            // Arming logic
            if (!armed && armThreshold != null) {
                if (direction == Direction.FALLING_BELOW && value >= armThreshold) {
                    armed = true;
                } else if (direction == Direction.RISING_ABOVE && value <= armThreshold) {
                    armed = true;
                }
            }

            if (!armed) continue;

            // Check if value is past threshold (with hysteresis)
            boolean pastThreshold;
            if (direction == Direction.FALLING_BELOW) {
                pastThreshold = value <= (threshold - hysteresis);
            } else {
                pastThreshold = value >= (threshold + hysteresis);
            }

            if (pastThreshold && !wasPastThreshold) {
                // Just crossed — record the start time
                crossingStartTime = time;
            }

            if (pastThreshold && crossingStartTime != null) {
                // Check hold duration
                boolean holdSatisfied = true;
                if (holdDurationSec != null && holdDurationSec > 0) {
                    long held = Duration.between(crossingStartTime, time).getSeconds();
                    holdSatisfied = held >= holdDurationSec;
                }

                if (holdSatisfied && !wasPastThreshold) {
                    // Check minimum gap
                    boolean gapSatisfied = true;
                    if (lastEventTime != null && minGapSec > 0) {
                        long gap = Duration.between(lastEventTime, crossingStartTime).getSeconds();
                        gapSatisfied = gap >= minGapSec;
                    }

                    if (gapSatisfied) {
                        events.add(new DetectedEvent(crossingStartTime, value));
                        lastEventTime = crossingStartTime;
                        armed = (armThreshold == null); // re-arm after event
                    }
                }
            }

            wasPastThreshold = pastThreshold;
            if (!pastThreshold) {
                crossingStartTime = null;
            }
        }

        // If searching backwards (most recent first), reverse and trim
        if (searchBackwards) {
            Collections.reverse(events);
        }

        // Trim to maxInstances
        if (events.size() > maxInstances) {
            events = new ArrayList<>(events.subList(0, maxInstances));
        }

        log.info("[Report] ThresholdCrossing detected {} events (max {})", events.size(), maxInstances);
        return events;
    }
}
