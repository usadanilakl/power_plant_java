package com.dk_power.power_plant_java;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Without @ActiveProfiles this inherits spring.profiles.active=prod,hub,server from
// application.properties and boots against the production H2 file and the live hub.
@SpringBootTest
@ActiveProfiles("test")
class PowerPlantJavaApplicationTests {

    @Test
    void contextLoads() {
    }

}
