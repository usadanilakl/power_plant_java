package com.dk_power.power_plant_java.config.logging;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DbPoolObservabilityService {

    private static final double HIGH_UTILIZATION_THRESHOLD = 0.80d;

    private final HikariDataSource hikariDataSource;
    private volatile boolean poolPressureActive = false;

    @PostConstruct
    public void logPoolConfiguration() {
        log.info(
            "db.pool.startup poolName={} maxPoolSize={} minIdle={} connectionTimeoutMs={} leakDetectionMs={} jdbcUrl={}",
            hikariDataSource.getPoolName(),
            hikariDataSource.getMaximumPoolSize(),
            hikariDataSource.getMinimumIdle(),
            hikariDataSource.getConnectionTimeout(),
            hikariDataSource.getLeakDetectionThreshold(),
            sanitizeJdbcUrl(hikariDataSource.getJdbcUrl())
        );
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 60000)
    public void monitorPoolPressure() {
        HikariPoolMXBean poolMxBean = hikariDataSource.getHikariPoolMXBean();
        if (poolMxBean == null) {
            return;
        }

        int active = poolMxBean.getActiveConnections();
        int idle = poolMxBean.getIdleConnections();
        int total = poolMxBean.getTotalConnections();
        int awaiting = poolMxBean.getThreadsAwaitingConnection();
        int max = hikariDataSource.getMaximumPoolSize();
        double utilization = max > 0 ? (double) active / max : 0.0d;

        boolean pressure = awaiting > 0 || utilization >= HIGH_UTILIZATION_THRESHOLD;
        if (pressure) {
            poolPressureActive = true;
            log.warn(
                "db.pool.pressure poolName={} active={} idle={} total={} max={} awaiting={} utilizationPct={}",
                hikariDataSource.getPoolName(),
                active,
                idle,
                total,
                max,
                awaiting,
                Math.round(utilization * 100.0d)
            );
            return;
        }

        if (poolPressureActive) {
            poolPressureActive = false;
            log.info(
                "db.pool.recovered poolName={} active={} idle={} total={} max={} awaiting={}",
                hikariDataSource.getPoolName(),
                active,
                idle,
                total,
                max,
                awaiting
            );
        }
    }

    private String sanitizeJdbcUrl(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return "unknown";
        }
        int semicolonIndex = jdbcUrl.indexOf(';');
        return semicolonIndex >= 0 ? jdbcUrl.substring(0, semicolonIndex) : jdbcUrl;
    }
}
