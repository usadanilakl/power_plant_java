package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;

import java.util.Collections;
import java.util.List;

public interface SharePointAccess {

    // WorkRequest operations
    List<WorkRequestDto> getAllWorkRequests();

    /**
     * Create a new work request in SharePoint.
     * @param dto the work request data
     * @return the SharePoint ID of the created item, or null if creation failed
     */
    String createWorkRequest(WorkRequestDto dto);

    void archiveWorkRequest(String sharepointId);

    void changeWorkRequestStatus(String sharepointId, String status);

    // JHA operations
    default List<JhaDto> getAllJhas() { return Collections.emptyList(); }

    default String createJha(JhaDto dto) { return null; }

    default void updateJha(String sharepointId, JhaDto dto) {}

    // Attachment operations
    default void addAttachment(String entityType, String sharepointId, PaAttachmentDto attachment) {}

    // Confined Space operations
    List<SpaceDto> getAllSpaces();

    boolean isAvailable();

    String getName();
}
