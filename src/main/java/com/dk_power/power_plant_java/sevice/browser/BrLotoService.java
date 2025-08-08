package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.dto.browser.BrLotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.browser.BrLotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BrLotoService {
    private final BrLotoStandardMapper lotoStandardMapper;
    private final LotoStandardRepo lotoStandardRepo;
    private final BrLotoPointService lotoPointService;

    public BrLotoStandard createStandard(BrLotoStandard standard) {
        LotoStandard entity = lotoStandardMapper.toEntity(standard);
        return lotoStandardMapper.toDto(entity);
    }

    public List<BrLotoStandard> getAll() {
        List<LotoStandard> all = lotoStandardRepo.findAll();
        return lotoStandardMapper.toDtoAll(all);
    }

    public List<BrLotoPoint> getStandardPoints(Long standardId) {
        Optional<LotoStandard> byId = lotoStandardRepo.findById(standardId);
        if(byId.isPresent() && byId.get().getLotoPoints()!=null) return lotoPointService.allToDto(byId.get().getLotoPoints());
        throw new RuntimeException("Standard with id: " + standardId + " wasn't found");
    }
}
