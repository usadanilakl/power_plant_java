package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.Box;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.entities.permits.lotos.TestLoto;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BoxRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.LotoRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.TestLotoRepo;
import com.dk_power.power_plant_java.repository.plant.EquipmentTypeRepo;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.files.FileUploaderService;
import com.dk_power.power_plant_java.sevice.permits.BasePermitService;
import com.dk_power.power_plant_java.sevice.permits.BoxService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.util.DataGenerator;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final GroupService<EquipmentType> equipmentTypeGroupService;
private final FileUploaderService fileUploaderService;
private final FileRepo fileRepo;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
//        fileUploaderService.getFileFromGitHub(Util.toList(fileRepo.findAll()).get(0).getLink());
//        fileUploaderService.PdfToJpgConverter();
        System.out.println("=====================================================");



    }
}
