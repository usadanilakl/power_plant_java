package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * Bounded executor for sync-broadcast @Async listeners.
 * <p>
 * The default Spring executor (SimpleAsyncTaskExecutor) creates unbounded threads
 * on demand — fine for occasional work, dangerous when a burst of writes
 * arrives (mass import, snapshot restore, SharePoint pull). Adding a third
 * listener ({@code LocalChangeSseBroadcaster}) on top of {@code CentralSyncService}
 * and {@code HubLocalChangeBroadcaster} would compound that risk.
 * <p>
 * This executor caps at 8 threads, queues 500 tasks, and falls back to running
 * on the caller when the queue is full — so a burst starts back-pressuring the
 * write path instead of spawning threads without limit.
 */
@Configuration
public class SyncBroadcastAsyncConfig {

    public static final String EXECUTOR_NAME = "syncBroadcastExecutor";

    @Bean(name = EXECUTOR_NAME)
    public TaskExecutor syncBroadcastExecutor() {
        ThreadPoolTaskExecutor e = new ThreadPoolTaskExecutor();
        e.setCorePoolSize(2);
        e.setMaxPoolSize(8);
        e.setQueueCapacity(500);
        e.setThreadNamePrefix("sync-broadcast-");
        e.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        e.setAllowCoreThreadTimeOut(true);
        e.setKeepAliveSeconds(60);
        e.initialize();
        return e;
    }
}
