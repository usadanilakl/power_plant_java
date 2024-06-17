package com.dk_power.power_plant_java.util.data_transfer;

import com.dk_power.power_plant_java.entities.plant.EqPojo;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Component
@AllArgsConstructor
public class TransferMethods {
    private final FileServiceImpl fileService;
    private final PointServiceImpl pointService;
    public void transferPids(){
        List<FileObject> files = new JsonToPojo<FileObject>().readProductsFromFile("/pids_json_mod.js",FileObject.class);
        System.out.println(files.size());

        for (FileObject file : files) {
            fileService.saveForTransfer(file);
        }
    }

    public void transferPoints(){
        List<Point> points = new JsonToPojo<Point>().readProductsFromFile("/Equipment_mod.js", Point.class);
        System.out.println(points.size());
        int n = 0;
        for (Point point : points) {
            Point p = pointService.saveForTransfer(point);
            pointService.save(p);
            System.out.println(++n +" " + point.getPid());
            //if(n==2) break;

        }
    }
}
