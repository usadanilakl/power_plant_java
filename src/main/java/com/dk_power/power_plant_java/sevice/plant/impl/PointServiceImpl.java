package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.repository.plant.PointRepo;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

@Service
public class PointServiceImpl extends GroupServiceImpl<Point>{
    private final PointRepo repository;
    public PointServiceImpl(PointRepo repository) {
        super(repository);
        this.repository = repository;
    }



}
