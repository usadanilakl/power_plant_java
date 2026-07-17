package com.dk_power.power_plant_java.sevice.sync;

import org.springframework.stereotype.Component;

/**
 * Request-scoped stash for the browser tab's {@code X-Client-Id} header.
 * <p>
 * The frontend {@code SyncUpdateService} generates a per-tab UUID on load and
 * stamps every non-GET request with {@code X-Client-Id: <uuid>}. The
 * {@link com.dk_power.power_plant_java.config.ClientIdRequestFilter} reads
 * that header, calls {@link #set(String)}, and clears in a {@code finally}.
 * {@link com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker} then
 * captures the value and threads it into the emitted
 * {@link SyncEventPublisher.ChangesDetectedEvent} so downstream SSE broadcasters
 * echo it back to clients — letting the writing tab suppress its own event.
 * <p>
 * Plain {@link ThreadLocal} intentionally — not {@link InheritableThreadLocal}
 * (would leak into async executor threads) and not MDC (Spring's async paths
 * don't reliably propagate MDC across the {@code afterCommit} boundary; we
 * capture into a local before crossing that line).
 */
@Component
public class RequestClientIdContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    public void set(String clientId) {
        CURRENT.set(clientId);
    }

    /** @return the client id stashed by the request filter, or {@code null} for background paths. */
    public String currentOrNull() {
        return CURRENT.get();
    }

    public void clear() {
        CURRENT.remove();
    }
}
