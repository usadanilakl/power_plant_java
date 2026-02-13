package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.entities.permits.Space;
import com.dk_power.power_plant_java.mappers.permits.SpaceMapper;
import com.dk_power.power_plant_java.repository.permits.SpaceRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SpaceService {
    private final SpaceRepo spaceRepo;
    private final SpaceMapper spaceMapper;

    public List<SpaceDto> loadAndSyncAllSpaces() {
        List<Space> allLocalSpaces = spaceRepo.findAll();
        return null;
    }
}
