package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.repository.permits.LotoRepo;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final UserRepo userRepo;
private final LotoRepo lotoRepo;
private final PermitNumbersRepo permitNumbersRepo;
    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    public void run(String... args) throws Exception {
       // Util.lotoNumber = permitNumbersRepo.findByPermitType("loto").getNumber();
    }


}
