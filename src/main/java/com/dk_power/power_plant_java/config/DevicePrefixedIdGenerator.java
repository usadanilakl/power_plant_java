package com.dk_power.power_plant_java.config;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.springframework.beans.factory.annotation.Value;

import java.io.Serializable;

public class DevicePrefixedIdGenerator implements IdentifierGenerator {

    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    @Value("${device.number}")
    private long deviceNumber;

@Override
public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
    long nextId;
    try {
        nextId = ((Number) session.createNativeQuery("SELECT NEXT VALUE FOR id_seq").uniqueResult()).longValue();
    } catch (Exception e) {
        throw new HibernateException("Unable to generate ID", e);
    }
    return deviceNumber * DEVICE_ID_MULTIPLIER + nextId;
}
    
}