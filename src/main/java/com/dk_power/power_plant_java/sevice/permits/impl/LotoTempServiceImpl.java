package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.repository.permits.LotoTempRepo;
import com.dk_power.power_plant_java.sevice.permits.LotoTempService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
@Service
@AllArgsConstructor
public class LotoTempServiceImpl implements LotoTempService {
    private final LotoTempRepo lotoTempRepo;
    @Override
    public LotoTemp saveTempLoto(LotoTemp loto) {
        lotoTempRepo.save(loto);
        return loto;
    }

    @Override
    public LotoTemp getTempById(String id) {
        return lotoTempRepo.findById(id).orElse(null);
    }

    @Override
    public Optional<LotoTemp> getTempByUser(String user) {
        return lotoTempRepo.findByCreatedBy(user);
    }
}
