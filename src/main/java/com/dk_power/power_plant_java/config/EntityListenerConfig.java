package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.EntityStateCapture;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeEntityListener;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to wire Spring beans into JPA EntityListener.
 *
 * JPA EntityListeners are instantiated by JPA, not Spring, so we need
 * to inject Spring-managed beans through static setters after context initialization.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class EntityListenerConfig {

    private final FieldChangeTracker fieldChangeTracker;
    private final EntityStateCapture entityStateCapture;

    @PostConstruct
    public void init() {
        // Inject Spring beans into the static entity listener
        FieldChangeEntityListener.setFieldChangeTracker(fieldChangeTracker);
        FieldChangeEntityListener.setEntityStateCapture(entityStateCapture);
        log.info("Field change tracking initialized for entity listener");
    }
}
