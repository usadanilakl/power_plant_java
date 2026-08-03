package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/** Small fixed-window limiter keyed by configured service identity and operation. */
@Service
public class AiDiagnosticsRateLimiter {

    private final AiDiagnosticsProperties properties;
    private final Clock clock;
    private final Map<BucketKey, Counter> counters = new ConcurrentHashMap<>();

    @Autowired
    public AiDiagnosticsRateLimiter(AiDiagnosticsProperties properties) {
        this(properties, Clock.systemUTC());
    }

    AiDiagnosticsRateLimiter(AiDiagnosticsProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public Decision check(String identity, Operation operation) {
        Policy policy = policy(operation);
        long now = clock.millis();
        long windowNumber = Math.floorDiv(now, policy.windowMillis());
        BucketKey key = new BucketKey(identity, operation);
        AtomicReference<Decision> decision = new AtomicReference<>();

        counters.compute(key, (ignored, existing) -> {
            Counter current = existing == null || existing.windowNumber() != windowNumber
                ? new Counter(windowNumber, 0) : existing;
            long retryAfterMillis = Math.max(1,
                Math.multiplyExact(windowNumber + 1, policy.windowMillis()) - now);
            if (policy.limit() < 1 || current.count() >= policy.limit()) {
                decision.set(new Decision(false, ceilSeconds(retryAfterMillis)));
                return current;
            }
            decision.set(new Decision(true, 0));
            return new Counter(windowNumber, current.count() + 1);
        });
        return decision.get();
    }

    @Scheduled(fixedDelayString = "${logging.ai-diagnostics.rate-limit.cleanup-interval:PT5M}")
    public void cleanupExpiredBuckets() {
        if (!properties.isEnabled() || counters.isEmpty()) {
            return;
        }
        long now = clock.millis();
        counters.entrySet().removeIf(entry -> {
            Policy policy = policy(entry.getKey().operation());
            long currentWindow = Math.floorDiv(now, policy.windowMillis());
            return entry.getValue().windowNumber() < currentWindow;
        });
    }

    int bucketCount() {
        return counters.size();
    }

    private Policy policy(Operation operation) {
        AiDiagnosticsProperties.RateLimit configured = properties.getRateLimit();
        return switch (operation) {
            case HISTORICAL -> new Policy(configured.getHistoricalRequestsPerMinute(), Duration.ofMinutes(1).toMillis());
            case STREAM_OPEN -> new Policy(configured.getStreamOpensPerMinute(), Duration.ofMinutes(1).toMillis());
            case BUNDLE -> new Policy(configured.getBundleRequestsPerHour(), Duration.ofHours(1).toMillis());
        };
    }

    private long ceilSeconds(long milliseconds) {
        return Math.max(1, (milliseconds + 999) / 1000);
    }

    public enum Operation {
        HISTORICAL,
        STREAM_OPEN,
        BUNDLE
    }

    public record Decision(boolean allowed, long retryAfterSeconds) {
    }

    private record Policy(int limit, long windowMillis) {
    }

    private record BucketKey(String identity, Operation operation) {
    }

    private record Counter(long windowNumber, int count) {
    }
}
