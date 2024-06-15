package com.dk_power.power_plant_java.util.data_transfer;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
@Component
@AllArgsConstructor
public class TransferMethods {
    private final FileServiceImpl fileService;
    private final PointServiceImpl pointService;
    public void transferPids(){
        List<FileObject> files = new JsonToPojo<FileObject>().readProductsFromFile("/pids_json_mod.js",FileObject.class);

        for (FileObject file : files) {
            file.buildFileLink();
            file.setRelatedSystems(file.getSystems().toString());
            fileService.saveForTransfer(file);
        }
    }

    public void transferPoints(){
        List<Point> points = new JsonToPojo<Point>().readProductsFromFile("/Equipment_mod.js", Point.class);
        System.out.println(points.size());
        int n = 0;
        for (Point point : points) {
            pointService.saveForTransfer(point);
            System.out.println(++n + point.getPid());
        }
        System.out.println(n);
    }
}
