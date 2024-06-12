package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final GroupService<EquipmentType> equipmentTypeGroupService;
private final FileUploaderService fileUploaderService;
private final FileRepo fileRepo;
private final FileServiceImpl fileService;


    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
//        fileUploaderService.getFileFromGitHub(Util.toList(fileRepo.findAll()).get(0).getLink());
//        fileUploaderService.PdfToJpgConverter();
        System.err.println("=====================================================");
//        List<EqPojo> points = new JsonToPojo<EqPojo>().readProductsFromFile("/Equipment.js", EqPojo.class);
//        System.out.println(points.get(0).getArea());

//        List<Point> points = new JsonToPojo<Point>().readProductsFromFile("/Equipment.js", Point.class);
//        System.out.println(points.get(0).getC());




    }
}
