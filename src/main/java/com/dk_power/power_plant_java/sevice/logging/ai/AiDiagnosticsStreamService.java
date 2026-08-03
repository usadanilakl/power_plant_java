package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsPrincipal;
import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/** Bounded, read-only SSE fan-out backed by incremental sanitized queries. */
@Service
@Slf4j
public class AiDiagnosticsStreamService {

    private static final Set<String> STREAM_LEVELS = Set.of("WARN", "ERROR");

    private final AiDiagnosticsProperties properties;
    private final AiDiagnosticsEventSource eventSource;
    private final AiDiagnosticsCursorCodec cursorCodec;
    private final Map<String, ClientConnection> clients = new ConcurrentHashMap<>();
    private final Object connectionLock = new Object();

    private ScheduledExecutorService scheduler;
    private ThreadPoolExecutor dispatcher;

    public AiDiagnosticsStreamService(
        AiDiagnosticsProperties properties,
        AiDiagnosticsEventSource eventSource,
        AiDiagnosticsCursorCodec cursorCodec
    ) {
        this.properties = properties;
        this.eventSource = eventSource;
        this.cursorCodec = cursorCodec;
    }

    @PostConstruct
    public void start() {
        if (!properties.isEnabled()) {
            return;
        }
        validateConfiguration();
        AiDiagnosticsProperties.Stream stream = properties.getStream();
        scheduler = new ScheduledThreadPoolExecutor(2, daemonThreadFactory("ai-diagnostics-scheduler-"));
        dispatcher = new ThreadPoolExecutor(
            stream.getDispatcherThreads(), stream.getDispatcherThreads(), 30, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(stream.getDispatcherQueueCapacity()),
            daemonThreadFactory("ai-diagnostics-dispatch-"),
            new ThreadPoolExecutor.AbortPolicy()
        );
        scheduler.scheduleWithFixedDelay(this::pollSafely, 0,
            stream.getPollInterval().toMillis(), TimeUnit.MILLISECONDS);
        scheduler.scheduleWithFixedDelay(this::heartbeatSafely,
            stream.getHeartbeatInterval().toMillis(), stream.getHeartbeatInterval().toMillis(),
            TimeUnit.MILLISECONDS);
    }

    public SseEmitter subscribe(
        AiDiagnosticsPrincipal principal,
        String lastEventId,
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId
    ) {
        if (!properties.isEnabled() || dispatcher == null) {
            throw new IllegalStateException("AI diagnostics streaming is disabled");
        }
        EventCursor initialCursor = initialCursor(lastEventId);
        ClientFilter filter = new ClientFilter(
            bounded(subsystem, "subsystem"), bounded(eventCode, "eventCode"),
            bounded(requestId, "requestId"), bounded(syncRunId, "syncRunId"),
            bounded(machineId, "machineId"));

        ClientConnection client;
        synchronized (connectionLock) {
            long identityConnections = clients.values().stream()
                .filter(existing -> existing.identity.equals(principal.identity()))
                .count();
            if (clients.size() >= properties.getStream().getMaxConnections()) {
                throw new AiDiagnosticsConnectionLimitException("Global diagnostics stream limit reached");
            }
            if (identityConnections >= properties.getStream().getMaxConnectionsPerIdentity()) {
                throw new AiDiagnosticsConnectionLimitException("Diagnostics stream limit reached for this identity");
            }

            SseEmitter emitter = new SseEmitter(properties.getStream().getMaxLifetime().toMillis());
            client = new ClientConnection(
                UUID.randomUUID().toString(), principal.identity(), emitter, filter,
                initialCursor.eventId(), initialCursor.timestamp(),
                properties.getStream().getMaxQueuedEventsPerConnection(),
                Instant.now().plus(properties.getStream().getMaxLifetime()));
            clients.put(client.id, client);
        }

        Runnable cleanup = () -> remove(client, "closed");
        client.emitter.onCompletion(cleanup);
        client.emitter.onTimeout(() -> remove(client, "lifetime_expired"));
        client.emitter.onError(error -> remove(client, "transport_error"));
        enqueue(client, new Outbound("connected", null, Map.of(
            "status", "connected",
            "resumeFrom", lastEventId == null ? "live" : lastEventId,
            "levels", STREAM_LEVELS
        )), false);
        client.ready.set(true);

        log.info("audit.ai_diagnostics.stream_open identity={} activeConnections={}",
            principal.identity(), clients.size());
        return client.emitter;
    }

    public int activeConnections() {
        return clients.size();
    }

    private void pollSafely() {
        try {
            Instant now = Instant.now();
            for (ClientConnection client : clients.values()) {
                if (!client.ready.get()) {
                    continue;
                }
                if (now.isAfter(client.expiresAt)) {
                    remove(client, "lifetime_expired");
                    client.emitter.complete();
                    continue;
                }
                poll(client, now);
            }
        } catch (RuntimeException e) {
            log.warn("AI diagnostics stream polling failed: {}", e.getMessage());
        }
    }

    private void poll(ClientConnection client, Instant now) {
        AiDiagnosticsEventPage page;
        try {
            page = eventSource.query(new AiDiagnosticsQuery(
                client.queryTimestamp, now, properties.getStream().getMaxEventsPerPoll(),
                client.queryEventId, AiDiagnosticsSort.ASC, STREAM_LEVELS,
                null, null, client.filter.subsystem(), client.filter.eventCode(),
                client.filter.requestId(), client.filter.syncRunId(), client.filter.machineId()
            ));
        } catch (RuntimeException e) {
            log.warn("AI diagnostics stream query failed identity={}: {}", client.identity, e.getMessage());
            return;
        }

        for (AiDiagnosticsEventDto event : page.events()) {
            if (!enqueue(client, new Outbound("log", event.id(), event), true)) {
                return;
            }
            // Advance when safely accepted into our bounded queue. If the transport drops
            // before delivery, the client reconnects with its last actually received SSE id.
            client.queryEventId = event.id();
            client.queryTimestamp = cursorCodec.decode(event.id()).timestamp();
        }
    }

    private void heartbeatSafely() {
        try {
            for (ClientConnection client : clients.values()) {
                if (!client.ready.get()) {
                    continue;
                }
                enqueue(client, new Outbound("heartbeat", null,
                    Map.of("timestamp", Instant.now().toString())), false);
            }
        } catch (RuntimeException e) {
            log.debug("AI diagnostics heartbeat failed: {}", e.getMessage());
        }
    }

    private boolean enqueue(ClientConnection client, Outbound outbound, boolean closeOnOverflow) {
        if (!clients.containsKey(client.id)) {
            return false;
        }
        if (!client.queue.offer(outbound)) {
            if (closeOnOverflow) {
                log.warn("audit.ai_diagnostics.stream_overrun identity={} queueCapacity={}",
                    client.identity, properties.getStream().getMaxQueuedEventsPerConnection());
                remove(client, "queue_overrun");
                client.emitter.completeWithError(new IOException("Diagnostics stream consumer is too slow"));
            }
            return false;
        }
        scheduleDrain(client);
        return true;
    }

    private void scheduleDrain(ClientConnection client) {
        if (!client.drainScheduled.compareAndSet(false, true)) {
            return;
        }
        try {
            dispatcher.execute(() -> drain(client));
        } catch (RejectedExecutionException e) {
            client.drainScheduled.set(false);
            remove(client, "dispatcher_saturated");
            client.emitter.completeWithError(new IOException("Diagnostics stream dispatcher is busy"));
        }
    }

    private void drain(ClientConnection client) {
        try {
            Outbound outbound;
            while ((outbound = client.queue.poll()) != null && clients.containsKey(client.id)) {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                    .name(outbound.name())
                    .data(outbound.data());
                if (outbound.id() != null) {
                    event.id(outbound.id());
                }
                client.emitter.send(event);
            }
        } catch (IOException | RuntimeException e) {
            remove(client, "send_failed");
            client.emitter.completeWithError(e);
        } finally {
            client.drainScheduled.set(false);
            if (!client.queue.isEmpty() && clients.containsKey(client.id)) {
                scheduleDrain(client);
            }
        }
    }

    private void remove(ClientConnection client, String reason) {
        if (clients.remove(client.id, client)) {
            log.info("audit.ai_diagnostics.stream_close identity={} reason={} activeConnections={}",
                client.identity, reason, clients.size());
        }
    }

    @PreDestroy
    public void stop() {
        clients.values().forEach(client -> client.emitter.complete());
        clients.clear();
        if (scheduler != null) {
            scheduler.shutdownNow();
        }
        if (dispatcher != null) {
            dispatcher.shutdownNow();
        }
    }

    private void validateConfiguration() {
        AiDiagnosticsProperties.Stream stream = properties.getStream();
        requirePositive(stream.getPollInterval(), "stream.poll-interval");
        requirePositive(stream.getHeartbeatInterval(), "stream.heartbeat-interval");
        requirePositive(stream.getMaxLifetime(), "stream.max-lifetime");
        requirePositive(stream.getInitialLookback(), "stream.initial-lookback");
        if (stream.getMaxConnections() < 1 || stream.getMaxConnectionsPerIdentity() < 1
            || stream.getMaxQueuedEventsPerConnection() < 1 || stream.getMaxEventsPerPoll() < 1
            || stream.getDispatcherThreads() < 1 || stream.getDispatcherQueueCapacity() < 1) {
            throw new IllegalStateException("AI diagnostics stream limits must all be positive");
        }
    }

    private void requirePositive(Duration duration, String name) {
        if (duration == null || duration.isZero() || duration.isNegative()) {
            throw new IllegalStateException("logging.ai-diagnostics." + name + " must be positive");
        }
    }

    private ThreadFactory daemonThreadFactory(String prefix) {
        AtomicInteger sequence = new AtomicInteger();
        return runnable -> {
            Thread thread = new Thread(runnable, prefix + sequence.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String bounded(String value, String name) {
        String normalized = blankToNull(value);
        int maxLength = Math.max(1, properties.getMaxFilterValueLength());
        if (normalized != null && normalized.length() > maxLength) {
            throw new IllegalArgumentException(name + " exceeds the maximum length of " + maxLength);
        }
        return normalized;
    }

    private EventCursor initialCursor(String eventId) {
        Instant now = Instant.now();
        if (eventId == null || eventId.isBlank()) {
            return new EventCursor(null, now.minus(properties.getStream().getInitialLookback()));
        }
        if (eventId.length() > Math.max(1, properties.getMaxCursorLength())) {
            throw new IllegalArgumentException("Last-Event-ID is invalid");
        }
        AiDiagnosticsCursorCodec.DecodedCursor decoded = cursorCodec.decode(eventId);
        Instant oldestRetained = now.minus(Duration.ofMinutes(
            Math.max(1, properties.getMaxHistoricalMinutes())));
        if (decoded.timestamp().isAfter(now.plusSeconds(5))) {
            throw new IllegalArgumentException("Last-Event-ID is from the future");
        }
        if (decoded.timestamp().isBefore(oldestRetained)) {
            return new EventCursor(null, oldestRetained);
        }
        return new EventCursor(eventId, decoded.timestamp());
    }

    private record ClientFilter(
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId
    ) {
    }

    private record Outbound(String name, String id, Object data) {
    }

    private static final class ClientConnection {
        private final String id;
        private final String identity;
        private final SseEmitter emitter;
        private final ClientFilter filter;
        private final ArrayBlockingQueue<Outbound> queue;
        private final AtomicBoolean drainScheduled = new AtomicBoolean();
        private final AtomicBoolean ready = new AtomicBoolean();
        private final Instant expiresAt;
        private volatile String queryEventId;
        private volatile Instant queryTimestamp;

        private ClientConnection(
            String id,
            String identity,
            SseEmitter emitter,
            ClientFilter filter,
            String lastEventId,
            Instant lastTimestamp,
            int queueCapacity,
            Instant expiresAt
        ) {
            this.id = id;
            this.identity = identity;
            this.emitter = emitter;
            this.filter = filter;
            this.queryEventId = lastEventId;
            this.queryTimestamp = lastTimestamp;
            this.queue = new ArrayBlockingQueue<>(queueCapacity);
            this.expiresAt = expiresAt;
        }
    }

    private record EventCursor(String eventId, Instant timestamp) {
    }
}
