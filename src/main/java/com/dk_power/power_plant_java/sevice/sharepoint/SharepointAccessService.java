package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class SharepointAccessService {

    private final SharePointCertificateAccess certificateAccess;
    private final PowerAutomateAccess powerAutomateAccess;

    public List<WorkRequestDto> getAllWorkRequests() {
        return executeWithFallback(
                () -> certificateAccess.getAllWorkRequests(),
                () -> powerAutomateAccess.getAllWorkRequests(),
                "getAllWorkRequests"
        );
    }

    /**
     * Create a new work request in SharePoint.
     * Uses certificate access first, falls back to Power Automate.
     * @param dto the work request data
     * @return the SharePoint ID of the created item, or null if creation failed
     */
    public String createWorkRequest(WorkRequestDto dto) {
        return executeWithFallback(
                () -> certificateAccess.createWorkRequest(dto),
                () -> powerAutomateAccess.createWorkRequest(dto),
                "createWorkRequest"
        );
    }

    public void archiveWorkRequest(String sharepointId) {
        executeWithFallback(
                () -> { certificateAccess.archiveWorkRequest(sharepointId); return null; },
                () -> { powerAutomateAccess.archiveWorkRequest(sharepointId); return null; },
                "archiveWorkRequest"
        );
    }

    public void changeWorkRequestStatus(String sharepointId, String status) {
        executeWithFallback(
                () -> { certificateAccess.changeWorkRequestStatus(sharepointId, status); return null; },
                () -> { powerAutomateAccess.changeWorkRequestStatus(sharepointId, status); return null; },
                "changeWorkRequestStatus"
        );
    }

    public List<SpaceDto> getAllSpaces() {
        return executeWithFallback(
                () -> certificateAccess.getAllSpaces(),
                () -> powerAutomateAccess.getAllSpaces(),
                "getAllSpaces"
        );
    }

    private <T> T executeWithFallback(Supplier<T> primary, Supplier<T> fallback, String operationName) {
        if (certificateAccess.isAvailable()) {
            try {
                T result = primary.get();
                log.debug("{} succeeded via {}", operationName, certificateAccess.getName());
                return result;
            } catch (Exception e) {
                log.warn("{} failed via {}: {}. Falling back to {}",
                        operationName, certificateAccess.getName(),
                        e.getMessage(), powerAutomateAccess.getName());
            }
        } else {
            log.debug("{} skipping {} (not available), using {}",
                    operationName, certificateAccess.getName(), powerAutomateAccess.getName());
        }

        try {
            T result = fallback.get();
            log.debug("{} succeeded via {}", operationName, powerAutomateAccess.getName());
            return result;
        } catch (Exception e) {
            log.error("{} failed via BOTH access methods. Last error: {}", operationName, e.getMessage());
            throw new RuntimeException("SharePoint access failed for " + operationName +
                    " via both certificate and Power Automate", e);
        }
    }
}
