package com.dk_power.power_plant_java.config.logging;

import org.slf4j.MDC;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class LoggingContext {

    public static final String REQUEST_ID = "requestId";
    public static final String METHOD = "method";
    public static final String PATH = "path";
    public static final String REMOTE_IP = "remoteIp";
    public static final String USER_ID = "userId";
    public static final String MACHINE_ID = "machineId";
    public static final String JOB_NAME = "jobName";
    public static final String JOB_RUN_ID = "jobRunId";
    public static final String SYNC_RUN_ID = "syncRunId";
    public static final String ENTITY_TYPE = "entityType";
    public static final String ENTITY_ID = "entityId";
    public static final String SHAREPOINT_ID = "sharepointId";

    private LoggingContext() {
    }

    public static void put(String key, String value) {
        if (value == null || value.isBlank()) {
            MDC.remove(key);
            return;
        }
        MDC.put(key, value);
    }

    public static void remove(String key) {
        MDC.remove(key);
    }

    public static void setUserId(String userId) {
        put(USER_ID, userId);
    }

    public static void setMachineId(String machineId) {
        put(MACHINE_ID, machineId);
    }

    public static Scope openJobScope(String jobName) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put(JOB_NAME, jobName);
        values.put(JOB_RUN_ID, shortId("job"));
        return openScope(values);
    }

    public static Scope openSyncScope(String syncName, String machineId) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put(SYNC_RUN_ID, shortId("sync"));
        values.put(JOB_NAME, syncName);
        values.put(MACHINE_ID, machineId);
        return openScope(values);
    }

    public static Scope openEntityScope(String entityType, String entityId, String sharepointId) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put(ENTITY_TYPE, entityType);
        values.put(ENTITY_ID, entityId);
        values.put(SHAREPOINT_ID, sharepointId);
        return openScope(values);
    }

    public static Scope openScope(Map<String, String> values) {
        Map<String, String> previous = new LinkedHashMap<>();
        values.forEach((key, value) -> {
            previous.put(key, MDC.get(key));
            put(key, value);
        });
        return new Scope(previous);
    }

    public static String shortId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public static final class Scope implements AutoCloseable {
        private final Map<String, String> previous;

        private Scope(Map<String, String> previous) {
            this.previous = previous;
        }

        @Override
        public void close() {
            previous.forEach((key, value) -> {
                if (value == null || value.isBlank()) {
                    MDC.remove(key);
                } else {
                    MDC.put(key, value);
                }
            });
        }
    }
}
