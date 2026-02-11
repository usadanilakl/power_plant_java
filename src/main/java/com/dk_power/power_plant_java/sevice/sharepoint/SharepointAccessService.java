package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
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
    private final PowerAutomateV2Access v2Access;

    // --- WorkRequest ---

    public List<WorkRequestDto> getAllWorkRequests() {
        return executeWithFallback(
                () -> certificateAccess.getAllWorkRequests(),
                () -> v2Access.getAllWorkRequests(),
                "getAllWorkRequests"
        );
    }

    public String createWorkRequest(WorkRequestDto dto) {
        return executeWithFallback(
                () -> certificateAccess.createWorkRequest(dto),
                () -> v2Access.createWorkRequest(dto),
                "createWorkRequest"
        );
    }

    public void archiveWorkRequest(String sharepointId) {
        executeWithFallback(
                () -> { certificateAccess.archiveWorkRequest(sharepointId); return null; },
                () -> { v2Access.archiveWorkRequest(sharepointId); return null; },
                "archiveWorkRequest"
        );
    }

    public void changeWorkRequestStatus(String sharepointId, String status) {
        executeWithFallback(
                () -> { certificateAccess.changeWorkRequestStatus(sharepointId, status); return null; },
                () -> { v2Access.changeWorkRequestStatus(sharepointId, status); return null; },
                "changeWorkRequestStatus"
        );
    }

    // --- JHA ---

    public List<JhaDto> getAllJhas() {
        return executeWithFallback(
                () -> certificateAccess.getAllJhas(),
                () -> v2Access.getAllJhas(),
                "getAllJhas"
        );
    }

    public String createJha(JhaDto dto) {
        return executeWithFallback(
                () -> certificateAccess.createJha(dto),
                () -> v2Access.createJha(dto),
                "createJha"
        );
    }

    public void updateJha(String sharepointId, JhaDto dto) {
        executeWithFallback(
                () -> { certificateAccess.updateJha(sharepointId, dto); return null; },
                () -> { v2Access.updateJha(sharepointId, dto); return null; },
                "updateJha"
        );
    }

    // --- Attachment ---

    public void addAttachment(String entityType, String sharepointId, PaAttachmentDto attachment) {
        executeWithFallback(
                () -> { certificateAccess.addAttachment(entityType, sharepointId, attachment); return null; },
                () -> { v2Access.addAttachment(entityType, sharepointId, attachment); return null; },
                "addAttachment"
        );
    }

    // --- Confined Space ---

    public List<SpaceDto> getAllSpaces() {
        return executeWithFallback(
                () -> certificateAccess.getAllSpaces(),
                () -> v2Access.getAllSpaces(),
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
                log.warn("{} failed via {}: {}. Falling back to V2",
                        operationName, certificateAccess.getName(), e.getMessage());
            }
        } else {
            log.debug("{} skipping {} (not available), using V2",
                    operationName, certificateAccess.getName());
        }

        try {
            T result = fallback.get();
            log.debug("{} succeeded via V2", operationName);
            return result;
        } catch (Exception e) {
            log.error("{} failed via BOTH access methods. Last error: {}", operationName, e.getMessage());
            throw new RuntimeException("SharePoint access failed for " + operationName +
                    " via both certificate and Power Automate V2", e);
        }
    }
}
