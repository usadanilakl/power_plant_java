package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
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
 * <p>
 * <b>Why also {@link AsyncConfigurer}:</b> because {@code syncBroadcastExecutor}
 * is the sole {@code TaskExecutor} bean in the context, Spring's async
 * auto-resolution can pick it up as the default for BARE {@code @Async}
 * annotations elsewhere ({@code CentralSyncService}, {@code HubLocalChangeBroadcaster},
 * etc.). That would route all async sync work through this bounded pool AND
 * fall back to CallerRunsPolicy when saturated — running {@code CentralSyncService.receive}
 * inline on the caller thread, which is the wrong scheduling for that path.
 * Declaring an explicit {@link #getAsyncExecutor()} pins the bare-@Async default
 * to {@code SimpleAsyncTaskExecutor} (the pre-existing behavior) while
 * {@code @Async("syncBroadcastExecutor")} still targets the bounded pool.
 */
@Configuration
public class SyncBroadcastAsyncConfig implements AsyncConfigurer {

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

    /**
     * Default executor for bare {@code @Async} — kept as
     * {@code SimpleAsyncTaskExecutor} to preserve the behavior that existed
     * before {@code syncBroadcastExecutor} was introduced. Sync broadcast
     * listeners opt into the bounded pool explicitly via
     * {@code @Async(SyncBroadcastAsyncConfig.EXECUTOR_NAME)}.
     */
    @Override
    public Executor getAsyncExecutor() {
        return new SimpleAsyncTaskExecutor("bare-async-");
    }
}
