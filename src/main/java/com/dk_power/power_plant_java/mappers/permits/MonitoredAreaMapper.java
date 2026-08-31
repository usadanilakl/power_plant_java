package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

/**
 * Sync-side mapper for {@link com.dk_power.power_plant_java.entities.permits.MonitoredArea}.
 *
 * <p>Deliberately the generic ModelMapper and nothing more. The screen-facing shape — last test,
 * hours since, overdue — is assembled by {@code NgAirMonitoringService}, because it is computed
 * from another entity and has no business travelling over sync as if it were stored.
 */
@Component
@RequiredArgsConstructor
public class MonitoredAreaMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
