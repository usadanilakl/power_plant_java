package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DuplicateMergeResultDto {
    private int groupsResolved;
    private int duplicatesDeleted;
    private int failed;
    private List<String> errors = new ArrayList<>();
    private DuplicateCheckReportDto reportBefore;
    private DuplicateCheckReportDto reportAfter;
}

