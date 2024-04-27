package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.repository.users.UserDao;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final UserDao userDao;
    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(userDao.findByEmail("usadanilakl@gmail.com").getEmail());
        System.out.println(userDao.findByEmail("usadanilakl@gmail.com").getId());
    }


}
