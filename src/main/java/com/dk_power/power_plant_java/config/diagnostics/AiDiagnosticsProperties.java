package com.dk_power.power_plant_java.config.diagnostics;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Configuration for the read-only AI diagnostics surface.
 *
 * <p>Only SHA-256 hashes belong in configuration. Raw service API keys must be
 * delivered to the agent through a secret manager and are never stored here.</p>
 */
@ConfigurationProperties(prefix = "logging.ai-diagnostics")
public class AiDiagnosticsProperties {

    private boolean enabled;
    private int maxApiKeyLength = 512;
    private int maxHistoricalMinutes = 24 * 60;
    private int maxEventsPerResponse = 500;
    private int maxCursorLength = 128;
    private int maxSearchTextLength = 512;
    private int maxFilterValueLength = 256;
    private List<ApiKey> apiKeys = new ArrayList<>();
    private Stream stream = new Stream();
    private Bundle bundle = new Bundle();
    private RateLimit rateLimit = new RateLimit();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxApiKeyLength() {
        return maxApiKeyLength;
    }

    public void setMaxApiKeyLength(int maxApiKeyLength) {
        this.maxApiKeyLength = maxApiKeyLength;
    }

    public int getMaxHistoricalMinutes() {
        return maxHistoricalMinutes;
    }

    public void setMaxHistoricalMinutes(int maxHistoricalMinutes) {
        this.maxHistoricalMinutes = maxHistoricalMinutes;
    }

    public int getMaxEventsPerResponse() {
        return maxEventsPerResponse;
    }

    public void setMaxEventsPerResponse(int maxEventsPerResponse) {
        this.maxEventsPerResponse = maxEventsPerResponse;
    }

    public int getMaxCursorLength() {
        return maxCursorLength;
    }

    public void setMaxCursorLength(int maxCursorLength) {
        this.maxCursorLength = maxCursorLength;
    }

    public int getMaxSearchTextLength() {
        return maxSearchTextLength;
    }

    public void setMaxSearchTextLength(int maxSearchTextLength) {
        this.maxSearchTextLength = maxSearchTextLength;
    }

    public int getMaxFilterValueLength() {
        return maxFilterValueLength;
    }

    public void setMaxFilterValueLength(int maxFilterValueLength) {
        this.maxFilterValueLength = maxFilterValueLength;
    }

    public List<ApiKey> getApiKeys() {
        return apiKeys;
    }

    public void setApiKeys(List<ApiKey> apiKeys) {
        this.apiKeys = apiKeys == null ? new ArrayList<>() : apiKeys;
    }

    public Stream getStream() {
        return stream;
    }

    public void setStream(Stream stream) {
        this.stream = stream == null ? new Stream() : stream;
    }

    public Bundle getBundle() {
        return bundle;
    }

    public void setBundle(Bundle bundle) {
        this.bundle = bundle == null ? new Bundle() : bundle;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit == null ? new RateLimit() : rateLimit;
    }

    public static class ApiKey {
        private String identity;
        private String sha256;
        private boolean enabled = true;
        private Instant expiresAt;
        private Set<String> scopes = new LinkedHashSet<>();

        public String getIdentity() {
            return identity;
        }

        public void setIdentity(String identity) {
            this.identity = identity;
        }

        public String getSha256() {
            return sha256;
        }

        public void setSha256(String sha256) {
            this.sha256 = sha256;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }

        public Set<String> getScopes() {
            return scopes;
        }

        public void setScopes(Set<String> scopes) {
            this.scopes = scopes == null ? new LinkedHashSet<>() : scopes;
        }
    }

    public static class Stream {
        private Duration pollInterval = Duration.ofSeconds(2);
        private Duration heartbeatInterval = Duration.ofSeconds(20);
        private Duration maxLifetime = Duration.ofMinutes(10);
        private Duration initialLookback = Duration.ofSeconds(5);
        private int maxConnections = 8;
        private int maxConnectionsPerIdentity = 2;
        private int maxQueuedEventsPerConnection = 200;
        private int maxEventsPerPoll = 100;
        private int dispatcherThreads = 2;
        private int dispatcherQueueCapacity = 64;

        public Duration getPollInterval() {
            return pollInterval;
        }

        public void setPollInterval(Duration pollInterval) {
            this.pollInterval = pollInterval;
        }

        public Duration getHeartbeatInterval() {
            return heartbeatInterval;
        }

        public void setHeartbeatInterval(Duration heartbeatInterval) {
            this.heartbeatInterval = heartbeatInterval;
        }

        public Duration getMaxLifetime() {
            return maxLifetime;
        }

        public void setMaxLifetime(Duration maxLifetime) {
            this.maxLifetime = maxLifetime;
        }

        public Duration getInitialLookback() {
            return initialLookback;
        }

        public void setInitialLookback(Duration initialLookback) {
            this.initialLookback = initialLookback;
        }

        public int getMaxConnections() {
            return maxConnections;
        }

        public void setMaxConnections(int maxConnections) {
            this.maxConnections = maxConnections;
        }

        public int getMaxConnectionsPerIdentity() {
            return maxConnectionsPerIdentity;
        }

        public void setMaxConnectionsPerIdentity(int maxConnectionsPerIdentity) {
            this.maxConnectionsPerIdentity = maxConnectionsPerIdentity;
        }

        public int getMaxQueuedEventsPerConnection() {
            return maxQueuedEventsPerConnection;
        }

        public void setMaxQueuedEventsPerConnection(int maxQueuedEventsPerConnection) {
            this.maxQueuedEventsPerConnection = maxQueuedEventsPerConnection;
        }

        public int getMaxEventsPerPoll() {
            return maxEventsPerPoll;
        }

        public void setMaxEventsPerPoll(int maxEventsPerPoll) {
            this.maxEventsPerPoll = maxEventsPerPoll;
        }

        public int getDispatcherThreads() {
            return dispatcherThreads;
        }

        public void setDispatcherThreads(int dispatcherThreads) {
            this.dispatcherThreads = dispatcherThreads;
        }

        public int getDispatcherQueueCapacity() {
            return dispatcherQueueCapacity;
        }

        public void setDispatcherQueueCapacity(int dispatcherQueueCapacity) {
            this.dispatcherQueueCapacity = dispatcherQueueCapacity;
        }
    }

    public static class Bundle {
        private int maxEvents = 2000;
        private int maxBytes = 5 * 1024 * 1024;
        private int pageSize = 500;

        public int getMaxEvents() {
            return maxEvents;
        }

        public void setMaxEvents(int maxEvents) {
            this.maxEvents = maxEvents;
        }

        public int getMaxBytes() {
            return maxBytes;
        }

        public void setMaxBytes(int maxBytes) {
            this.maxBytes = maxBytes;
        }

        public int getPageSize() {
            return pageSize;
        }

        public void setPageSize(int pageSize) {
            this.pageSize = pageSize;
        }
    }

    public static class RateLimit {
        private int historicalRequestsPerMinute = 60;
        private int streamOpensPerMinute = 6;
        private int bundleRequestsPerHour = 6;

        public int getHistoricalRequestsPerMinute() {
            return historicalRequestsPerMinute;
        }

        public void setHistoricalRequestsPerMinute(int historicalRequestsPerMinute) {
            this.historicalRequestsPerMinute = historicalRequestsPerMinute;
        }

        public int getStreamOpensPerMinute() {
            return streamOpensPerMinute;
        }

        public void setStreamOpensPerMinute(int streamOpensPerMinute) {
            this.streamOpensPerMinute = streamOpensPerMinute;
        }

        public int getBundleRequestsPerHour() {
            return bundleRequestsPerHour;
        }

        public void setBundleRequestsPerHour(int bundleRequestsPerHour) {
            this.bundleRequestsPerHour = bundleRequestsPerHour;
        }
    }
}
