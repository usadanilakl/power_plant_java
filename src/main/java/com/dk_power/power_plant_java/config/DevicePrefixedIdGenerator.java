package com.dk_power.power_plant_java.config;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.hibernate.jdbc.Work;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DevicePrefixedIdGenerator implements IdentifierGenerator {

    private static final long DEVICE_ID_MULTIPLIER = 1_000_000_000L;
    
    @Value("${device.number}")
    private long deviceNumber;

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
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

        return deviceNumber * DEVICE_ID_MULTIPLIER + work.getResult();
    }
}