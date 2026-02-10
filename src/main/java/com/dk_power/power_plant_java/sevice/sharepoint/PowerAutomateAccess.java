package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.clients.PowerAutomateClient;
import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PowerAutomateAccess implements SharePointAccess {

    private final PowerAutomateClient powerAutomateClient;

    @Override
    public List<WorkRequestDto> getAllWorkRequests() {
        return powerAutomateClient.getAllRequests();
    }

    @Override
    public void archiveWorkRequest(String sharepointId) {
        powerAutomateClient.archiveWorkRequests(sharepointId);
    }

    @Override
    public void changeWorkRequestStatus(String sharepointId, String status) {
        try {
            powerAutomateClient.changeWorkRequestStatus(sharepointId, status);
        } catch (Exception e) {
            throw new RuntimeException("PowerAutomate failed to change status: " + e.getMessage(), e);
        }
    }

    @Override
    public List<SpaceDto> getAllSpaces() {
        try {
            return powerAutomateClient.getAllSpaces();
        } catch (Exception e) {
            log.error("PowerAutomate failed to get spaces: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getName() {
        return "Power Automate (fallback)";
    }
}
