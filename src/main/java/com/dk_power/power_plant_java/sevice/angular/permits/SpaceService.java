package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.clients.PowerAutomateClient;
import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.entities.permits.Space;
import com.dk_power.power_plant_java.mappers.permits.SpaceMapper;
import com.dk_power.power_plant_java.repository.permits.SpaceRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SpaceService {
    private final SpaceRepo spaceRepo;
    private final SpaceMapper spaceMapper;
    private final PowerAutomateClient powerAutomateClient;

    public List<SpaceDto> loadAndSyncAllSpaces() throws IOException, InterruptedException {
        List<SpaceDto> allSpaces = powerAutomateClient.getAllSpaces();
        List<Space> allLocalSpaces = spaceRepo.findAll();
        return null;
    }
}
