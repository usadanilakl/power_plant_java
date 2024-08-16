package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LotoMapper implements BaseMapper{
    private final ModelMapper mapper;
    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

    public LotoDto convertToDto(Loto loto){
        return null;
    }
    public Loto convertToEntity(LotoDto lotoDto){
        return null;
    }
}
