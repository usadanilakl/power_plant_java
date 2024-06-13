package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.EqPojo;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.enums.SortingGroup;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.repository.plant.PointRepo;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import com.dk_power.power_plant_java.util.JsonToPojo;
import com.dk_power.power_plant_java.util.Util;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
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
private final FileServiceImpl fileService;
private final PointServiceImpl pointRepo;


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


        List<Point> points2 = new JsonToPojo<Point>().readProductsFromFile("/Equipment.js", Point.class);
        System.out.println("points2.get(0).getEqType().getName() = " + points2.get(0).getEqType().getName());
        System.out.println("points2.get(0).getVendor().getName() = " + points2.get(0).getVendor().getName());
        System.out.println(points2.get(0).getPid());

        int n = 0;
        for (Point point : points2) {

            point.setCoordinates(point.getC().toString());
            point.setOriginalPictureSize(point.getO().toString());
            FileObject fileObject = new FileObject();
            fileObject.setFileNumber(point.getPid().replace(".jpg",".pdf"));
            point.setMainFile(fileObject);
            pointRepo.save(point);

        }




    }
}
