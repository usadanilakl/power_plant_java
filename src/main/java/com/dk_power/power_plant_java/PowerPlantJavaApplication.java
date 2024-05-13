package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.LotoRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
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
private final BaseLotoRepo baseLotoRepo;
    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    public void run(String... args) throws Exception {
       // Util.lotoNumber = permitNumbersRepo.findByPermitType("loto").getNumber();
//        User user = new User();
//        user.setEmail("agorelik@jpowerusa.com");
//        user.setName("Andrew Gorelik");
//        user.setPassword("123");
//        user.setRole("Operator");
//        userRepo.save(user);
        Iterable<BaseLoto> all = baseLotoRepo.findAll();
        System.out.println("===========================================");
        all.forEach(e->{
            System.out.println(e.getId());
            baseLotoRepo.delete(e);
        });
    }


}
