package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;

import java.util.List;

public interface SharePointAccess {

    List<WorkRequestDto> getAllWorkRequests();

    void archiveWorkRequest(String sharepointId);

    void changeWorkRequestStatus(String sharepointId, String status);

    List<SpaceDto> getAllSpaces();

    boolean isAvailable();

    String getName();
}
