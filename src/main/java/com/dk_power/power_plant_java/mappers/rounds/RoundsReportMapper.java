package com.dk_power.power_plant_java.mappers.rounds;

import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

/**
 * Mapper for {@code RoundsReport} — exists to satisfy the {@code CrudService}
 * type contract required by the sync infrastructure. The CRDT field-sync
 * applies entity fields directly, so this mapper is not exercised by sync;
 * {@code NgRoundsService} does its own JSON (de)serialization.
 */
@Component
@RequiredArgsConstructor
public class RoundsReportMapper implements BaseMapper {

    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
