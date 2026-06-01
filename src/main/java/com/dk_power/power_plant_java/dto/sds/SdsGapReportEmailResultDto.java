package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Outcome of sending the SDS gap report email — counts let the operator confirm what shipped. */
@Data
public class SdsGapReportEmailResultDto {
    private boolean sent;
    private int missingFromDbCount;
    private int missingPdfCount;
    private int missingFromEbinderCount;
    private int attachmentsSent;
    private int attachmentsSkipped;
    private long totalAttachmentBytes;
    private String to;
    private String cc;
    private String message;
    private List<String> skippedReasons = new ArrayList<>();
}
