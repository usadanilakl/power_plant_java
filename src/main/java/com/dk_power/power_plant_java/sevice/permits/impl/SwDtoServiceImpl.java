package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.Sw;
import com.dk_power.power_plant_java.sevice.permits.SwDtoService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional
public class SwDtoServiceImpl implements SwDtoService {
    @Override
    public SwDto toDto(Sw sw) {
        return new SwDto(sw.getRequestor(),sw.getControlAuthority(), sw.getCreatedBy(), sw.getSystem(), sw.getEquipment(), sw.getCreatedBy());
    }

    @Override
    public Sw toEntity(SwDto sw) {
        return new Sw(sw.getWorkScope(),sw.getSystem(),sw.getEquipment(),sw.getRequestor(),sw.getControlAuthority());
    }
}
