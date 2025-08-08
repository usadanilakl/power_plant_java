package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.browser.BrLotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrLotoPointService {
    private final LotoPointRepo lotoPointRepo;
    private final BrLotoPointMapper lotoPointMapper;
    public List<BrLotoPoint> getAllBrLotoPoints() {
        return lotoPointMapper.toDtoAll(lotoPointRepo.findAll());
    }

    public List<BrLotoPoint> allToDto(Collection<LotoPoint> points) {
        return lotoPointMapper.toDtoAll(points);
    }
}
