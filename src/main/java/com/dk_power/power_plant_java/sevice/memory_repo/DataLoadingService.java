package com.dk_power.power_plant_java.sevice.memory_repo;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DataLoadingService {
    private final LotoService lotoService;
    private List<Loto> cachedLotos;

    public DataLoadingService(LotoService lotoService) {
        this.lotoService = lotoService;
    }

    @PostConstruct
    public void loadData() {
        cachedLotos = lotoService.getAll();
        // Add other queries as needed
    }

}