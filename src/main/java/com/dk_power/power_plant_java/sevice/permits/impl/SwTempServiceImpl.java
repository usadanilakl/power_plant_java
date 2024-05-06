package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.config.AuditingConfig;
import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.SwTemp;
import com.dk_power.power_plant_java.repository.permits.SwTempRepo;
import com.dk_power.power_plant_java.sevice.permits.SwTempService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
@Service
@AllArgsConstructor
public class SwTempServiceImpl implements SwTempService {
    private final SwTempRepo swTempRepo;
    private final AuditingConfig auditingConfig;
    @Override
    public SwTemp saveTempSw(SwTemp sw) {
        swTempRepo.save(sw);
        return sw;
    }

    @Override
    public SwTemp getTempById() {
        String id = auditingConfig.auditorProvider().getCurrentAuditor().get();
        SwTemp sw = swTempRepo.findById(id).orElse(null);
        if(sw==null)sw = saveTempSw(new SwTemp());
        return sw;
    }

    @Override
    public Optional<SwTemp> getTempByUser(String user) {
        return swTempRepo.findByCreatedBy(user);
    }

    @Override
    public SwTemp deleteTemp(SwTemp sw) {
        swTempRepo.delete(sw);
        return sw;
    }

    @Override
    public void resetFields() {
        SwTemp sw = getTempById();
        sw.copy(new SwDto());
        saveTempSw(sw);
    }
}
