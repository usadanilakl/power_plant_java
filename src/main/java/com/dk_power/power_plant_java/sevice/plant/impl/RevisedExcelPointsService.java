package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.RevisedExcelPoints;
import com.dk_power.power_plant_java.repository.plant.RevisedExcelPointsRepo;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class RevisedExcelPointsService {
    private final RevisedExcelPointsRepo revisedExcelPointsRepo;
    public List<RevisedExcelPoints> getPointsByLabel(String label){
        List<RevisedExcelPoints> result = new ArrayList<>();
        for(RevisedExcelPoints p : revisedExcelPointsRepo.findAll()){
            if(p.getLabel().toLowerCase().contains(label.toLowerCase())) result.add(p);
        }
        return result;
    }

    public List<RevisedExcelPoints> getAll() {
        return revisedExcelPointsRepo.findAll();
    }
    public RevisedExcelPoints save(RevisedExcelPoints point){
       return revisedExcelPointsRepo.save(point);
    }
    public void saveAll(List<RevisedExcelPoints> points){
        revisedExcelPointsRepo.saveAll(points);
    }
}
