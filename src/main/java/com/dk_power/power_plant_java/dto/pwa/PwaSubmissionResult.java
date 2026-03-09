package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaSubmissionResult {
    private boolean success;
    private String sharepointId;
    private String method;      // "server", "certificate", "powerAutomate", "local", "duplicate"
    private String message;
    private String localUuid;
    private Boolean requiresMerge;
    private String conflictType;

    public static PwaSubmissionResult success(String method, String sharepointId, String localUuid) {
        PwaSubmissionResult result = new PwaSubmissionResult();
        result.setSuccess(true);
        result.setMethod(method);
        result.setSharepointId(sharepointId);
        result.setLocalUuid(localUuid);
        result.setMessage("Submission successful via " + method);
        return result;
    }

    public static PwaSubmissionResult failure(String message, String localUuid) {
        PwaSubmissionResult result = new PwaSubmissionResult();
        result.setSuccess(false);
        result.setMessage(message);
        result.setLocalUuid(localUuid);
        return result;
    }

    public static PwaSubmissionResult duplicate(String sharepointId, String localUuid) {
        PwaSubmissionResult result = new PwaSubmissionResult();
        result.setSuccess(true);
        result.setMethod("duplicate");
        result.setSharepointId(sharepointId);
        result.setLocalUuid(localUuid);
        result.setMessage("Request already exists");
        return result;
    }

    public static PwaSubmissionResult mergeRequired(String conflictType, String message, String localUuid, String sharepointId) {
        PwaSubmissionResult result = new PwaSubmissionResult();
        result.setSuccess(false);
        result.setMethod("merge_required");
        result.setConflictType(conflictType);
        result.setRequiresMerge(true);
        result.setSharepointId(sharepointId);
        result.setLocalUuid(localUuid);
        result.setMessage(message);
        return result;
    }
}
