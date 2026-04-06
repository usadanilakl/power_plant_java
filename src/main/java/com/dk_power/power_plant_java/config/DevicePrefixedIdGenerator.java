package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.hibernate.jdbc.Work;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Custom ID generator that prefixes IDs with a device-specific number.
 * This ensures each machine generates unique IDs that don't conflict with other machines.
 *
 * ID format: DEVICE_NUMBER * 1_000_000_000 + SEQUENCE_VALUE
 * - Device numbers 0-99 give 1 billion IDs per device
 * - Device number must be explicitly configured in machine-id.properties
 *   (written by Electron first-run setup or loaded from device-configs/*.properties)
 * - Fallback: device 99 (reserved for unconfigured/dev machines) with WARNING
 *
 * Example:
 * - Device 0:  IDs            1 to   999,999,999
 * - Device 1:  IDs 1,000,000,001 to 1,999,999,999
 * - Device 10: IDs 10,000,000,001 to 10,999,999,999
 */
public class DevicePrefixedIdGenerator implements IdentifierGenerator {

    private static final Logger log = LoggerFactory.getLogger(DevicePrefixedIdGenerator.class);
    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    private static final String MACHINE_ID_FILE = "./machine-id.properties";

    // Cache the device number - loaded once per JVM
    private static volatile Long cachedDeviceNumber = null;
    private static final Object lock = new Object();

    @Override
    public Object generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        // If ID is pre-set (e.g., from sync), preserve it — don't generate a new one.
        if (object instanceof BaseIdEntity) {
            Long existingId = ((BaseIdEntity) object).getId();
            if (existingId != null) return existingId;
        }

        long deviceNumber = getDeviceNumber();

        class IdGeneratorWork implements Work {
            private long result;

            public void execute(Connection connection) throws SQLException {
                String sequenceSql = resolveSequenceSql(connection);
                try (PreparedStatement ps = connection.prepareStatement(sequenceSql);
                     ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        result = rs.getLong(1);
                    } else {
                        throw new SQLException("Unable to generate ID");
                    }
                }
            }

            public long getResult() {
                return result;
            }
        }

        IdGeneratorWork work = new IdGeneratorWork();
        session.doWork(work);

        long generatedId = deviceNumber * DEVICE_ID_MULTIPLIER + work.getResult();
        log.trace("Generated ID {} for {} (device={}, seq={})",
            generatedId, object.getClass().getSimpleName(), deviceNumber, work.getResult());

        return generatedId;
    }

    /**
     * Get the device number for this machine.
     * Reads from machine-id.properties (written by SyncConfig or Electron).
     * If not configured, falls back to device 9 with a WARNING.
     */
    private long getDeviceNumber() {
        if (cachedDeviceNumber != null) {
            return cachedDeviceNumber;
        }

        synchronized (lock) {
            if (cachedDeviceNumber != null) {
                return cachedDeviceNumber;
            }

            cachedDeviceNumber = loadDeviceNumber();
            log.info("Device number for ID generation: {}", cachedDeviceNumber);
            return cachedDeviceNumber;
        }
    }

    // Cache the resolved sequence SQL — detected once from connection metadata
    private static volatile String cachedSequenceSql = null;

    /**
     * Resolve the correct sequence next-value SQL for the current database dialect.
     * H2 uses "SELECT NEXT VALUE FOR id_seq", PostgreSQL uses "SELECT nextval('id_seq')".
     */
    private String resolveSequenceSql(Connection connection) throws SQLException {
        if (cachedSequenceSql != null) {
            return cachedSequenceSql;
        }
        String dbProduct = connection.getMetaData().getDatabaseProductName();
        if (dbProduct != null && dbProduct.toLowerCase().contains("postgresql")) {
            cachedSequenceSql = "SELECT nextval('id_seq')";
        } else {
            cachedSequenceSql = "SELECT NEXT VALUE FOR id_seq";
        }
        log.info("Database dialect detected: {} → sequence SQL: {}", dbProduct, cachedSequenceSql);
        return cachedSequenceSql;
    }

    private static final long FALLBACK_DEVICE_NUMBER = 99L;

    /**
     * Load device number from machine-id.properties.
     * This file is written by SyncConfig (from device config) or by Electron (first-run setup).
     * If not found, uses fallback device 99 with prominent warning.
     */
    private long loadDeviceNumber() {
        File file = new File(MACHINE_ID_FILE);

        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                Properties props = new Properties();
                props.load(fis);

                String deviceNumberStr = props.getProperty("device.number");
                if (deviceNumberStr != null && !deviceNumberStr.isEmpty()) {
                    try {
                        long num = Long.parseLong(deviceNumberStr);
                        if (num >= 0 && num <= 99) {
                            log.info("Loaded device number from {}: {}", MACHINE_ID_FILE, num);
                            return num;
                        }
                        log.warn("device.number={} is out of range (0-99) in {}", num, MACHINE_ID_FILE);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid device.number='{}' in {}", deviceNumberStr, MACHINE_ID_FILE);
                    }
                }
            } catch (Exception e) {
                log.error("Error reading {}: {}", MACHINE_ID_FILE, e.getMessage());
            }
        }

        // No valid device number found — use fallback
        log.error("=== DEVICE NUMBER NOT CONFIGURED ===");
        log.error("device.number not found in {}. Using fallback device {}.", MACHINE_ID_FILE, FALLBACK_DEVICE_NUMBER);
        log.error("Set DEVICE_CONFIG env var or configure device via Electron Settings.");
        log.error("IDs generated with fallback device may conflict with other machines!");
        log.error("=====================================");
        return FALLBACK_DEVICE_NUMBER;
    }
}
