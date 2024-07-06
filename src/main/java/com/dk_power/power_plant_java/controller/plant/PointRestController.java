package com.dk_power.power_plant_java.controller.plant;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.repository.plant.PointRepo;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/points")
@AllArgsConstructor
public class PointRestController {
    private final PointRepo pointRepo;
    @PostMapping("/create")
    public List<Point> createPoints(@RequestBody List<Point> points){
        for (Point point : points) {
            pointRepo.save(point);
        }
        return points;
    }
}
