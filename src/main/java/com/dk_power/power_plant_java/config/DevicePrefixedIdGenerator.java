package com.dk_power.power_plant_java.config;

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
import java.util.UUID;

/**
 * Custom ID generator that prefixes IDs with a device-specific number.
 * This ensures each machine generates unique IDs that don't conflict with other machines.
 *
 * ID format: DEVICE_NUMBER * 1_000_000_000 + SEQUENCE_VALUE
 * - Device numbers 1-9 give 1 billion IDs per device
 * - Device number is derived from machine-id.properties (persistent across restarts)
 *
 * Example:
 * - Device 1: IDs 1,000,000,001 to 1,999,999,999
 * - Device 2: IDs 2,000,000,001 to 2,999,999,999
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
        long deviceNumber = getDeviceNumber();

        class IdGeneratorWork implements Work {
            private long result;

            public void execute(Connection connection) throws SQLException {
                try (PreparedStatement ps = connection.prepareStatement("SELECT NEXT VALUE FOR id_seq");
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
     * Reads from machine-id.properties (creates if not exists).
     * Device number is derived from the machine ID hash to ensure uniqueness.
     */
    private long getDeviceNumber() {
        if (cachedDeviceNumber != null) {
            return cachedDeviceNumber;
        }

        synchronized (lock) {
            if (cachedDeviceNumber != null) {
                return cachedDeviceNumber;
            }

            cachedDeviceNumber = loadOrCreateDeviceNumber();
            log.info("Device number for ID generation: {}", cachedDeviceNumber);
            return cachedDeviceNumber;
        }
    }

    /**
     * Load device number from properties file, or create one based on machine ID.
     */
    private long loadOrCreateDeviceNumber() {
        File file = new File(MACHINE_ID_FILE);
        Properties props = new Properties();

        // Try to load existing file
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                props.load(fis);

                // Check if device.number is already set
                String deviceNumberStr = props.getProperty("device.number");
                if (deviceNumberStr != null && !deviceNumberStr.isEmpty()) {
                    try {
                        long num = Long.parseLong(deviceNumberStr);
                        if (num >= 1 && num <= 9) {
                            log.info("Loaded device number from file: {}", num);
                            return num;
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Invalid device.number in properties: {}", deviceNumberStr);
                    }
                }

                // Derive device number from machine ID
                String machineId = props.getProperty("machine.id");
                if (machineId != null && !machineId.isEmpty()) {
                    long deviceNumber = deriveDeviceNumber(machineId);
                    saveDeviceNumber(file, props, deviceNumber);
                    return deviceNumber;
                }
            } catch (Exception e) {
                log.error("Error loading machine-id.properties: {}", e.getMessage());
            }
        }

        // No file exists - create machine ID and device number
        String machineId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        long deviceNumber = deriveDeviceNumber(machineId);

        props.setProperty("machine.id", machineId);
        props.setProperty("device.number", String.valueOf(deviceNumber));

        try (FileOutputStream fos = new FileOutputStream(file)) {
            props.store(fos, "Machine identification for field-based sync and ID generation");
            log.info("Created new machine-id.properties with machine.id={}, device.number={}", machineId, deviceNumber);
        } catch (Exception e) {
            log.error("Error saving machine-id.properties: {}", e.getMessage());
        }

        return deviceNumber;
    }

    /**
     * Derive a device number (1-9) from a machine ID string.
     * Uses a hash to get a consistent number for each machine.
     */
    private long deriveDeviceNumber(String machineId) {
        // Use hashCode to get a deterministic number from the machine ID
        int hash = Math.abs(machineId.hashCode());
        // Map to range 1-9 (avoid 0 to keep IDs positive and distinguishable)
        return (hash % 9) + 1;
    }

    /**
     * Save the device number back to the properties file.
     */
    private void saveDeviceNumber(File file, Properties props, long deviceNumber) {
        props.setProperty("device.number", String.valueOf(deviceNumber));
        try (FileOutputStream fos = new FileOutputStream(file)) {
            props.store(fos, "Machine identification for field-based sync and ID generation");
            log.info("Saved device.number={} to machine-id.properties", deviceNumber);
        } catch (Exception e) {
            log.error("Error saving device.number: {}", e.getMessage());
        }
    }
}
