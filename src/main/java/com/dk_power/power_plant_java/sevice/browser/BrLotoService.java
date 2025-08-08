package com.dk_power.power_plant_java.sevice.browser;

import com.dk_power.power_plant_java.dto.browser.BrLotoStandard;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.browser.BrLotoStandardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BrLotoService {
    private final BrLotoStandardMapper lotoStandardMapper;

    public BrLotoStandard createStandard(BrLotoStandard standard) {
        LotoStandard entity = lotoStandardMapper.toEntity(standard);
        return lotoStandardMapper.toDto(entity);
    }
}
