package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DuplicateCheckReportDto {
    private int totalInstruments;
    private int duplicateGroupCount;
    private int duplicateItemCount;
    private List<DuplicateTagGroupDto> groups = new ArrayList<>();
}

