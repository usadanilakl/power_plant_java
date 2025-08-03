package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrHeatTrace;
import com.dk_power.power_plant_java.mappers.browser.BrHeatTraceMapper;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrHeatTraceService {
    private final BrHeatTraceMapper heatTraceMapper;
    private final HeatTraceRepo heatTraceRepo;

    public List<BrHeatTrace> getAllBrHeatTrace() {
        return heatTraceMapper.toDtoAll(heatTraceRepo.findAll());
    }

}
