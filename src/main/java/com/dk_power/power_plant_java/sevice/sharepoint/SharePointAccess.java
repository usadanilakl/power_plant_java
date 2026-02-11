package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;

import java.util.List;

public interface SharePointAccess {

    List<WorkRequestDto> getAllWorkRequests();

    /**
     * Create a new work request in SharePoint.
     * @param dto the work request data
     * @return the SharePoint ID of the created item, or null if creation failed
     */
    String createWorkRequest(WorkRequestDto dto);

    void archiveWorkRequest(String sharepointId);

    void changeWorkRequestStatus(String sharepointId, String status);

    List<SpaceDto> getAllSpaces();

    boolean isAvailable();

    String getName();
}
