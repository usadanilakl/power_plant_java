package com.dk_power.power_plant_java.sevice.memory_repo;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Getter
public class DataLoadingService {
    //private final LotoService lotoService;
    private final DataDistributionService dataDistributionService;
    private List<Loto> cachedLotos;
    private Map<String,Object> allData;


    @PostConstruct
    public void loadData() {
        //cachedLotos = lotoService.getAll();
         allData = dataDistributionService.getAllTransfers();
    }

}