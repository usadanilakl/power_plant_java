package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.sevice.permits.LotoDtoService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class LotoDtoServiceImpl implements LotoDtoService {
    @Override
    public LotoDto toDto(Loto loto) {
        return new LotoDto(loto.getRequestor(), loto.getControlAuthority(), loto.getCreatedBy(), loto.getSystem(), loto.getWorkScope(), loto.getEquipment());
    }

    @Override
    public Loto toEntity(LotoDto loto) {
        return new Loto(loto.getWorkScope(), loto.getSystem(), loto.getEquipment(), loto.getRequestor(), loto.getControlAuthority());
    }
}
