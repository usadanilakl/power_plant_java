package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.plant.Point;

import java.util.List;

public interface PointRepo extends GroupRepo<Point> {
    Point findByLabel(String lable);

    List<Point> findByCoordinates(String coordinates);
}
