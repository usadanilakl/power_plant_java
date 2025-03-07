package com.dk_power.power_plant_java.config;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import java.io.Serializable;

public class DevicePrefixedIdGenerator implements IdentifierGenerator {

    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    private static final long deviceNumber = getDeviceNumber(); // Implement this method to get the device number

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        long nextId = ((Number) session.createNativeQuery("SELECT NEXT VALUE FOR id_seq").uniqueResult()).longValue();
        return deviceNumber * DEVICE_ID_MULTIPLIER + nextId;
    }

    private static long getDeviceNumber() {
        // Implement this method to return the device number (1-9)
        // This could be read from a configuration file, environment variable, or database
        return 1; // Example: returning 1 for device #1
    }
}