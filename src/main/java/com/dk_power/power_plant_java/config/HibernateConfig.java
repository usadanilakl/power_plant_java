package com.dk_power.power_plant_java.config;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateConfig {
    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Bean
    public SessionFactory sessionFactory() {
        if (entityManagerFactory.unwrap(SessionFactory.class) == null) {
            throw new NullPointerException("Factory is not a hibernate factory");
        }
        return entityManagerFactory.unwrap(SessionFactory.class);
    }
}