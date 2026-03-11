package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CounterpartCreateResultDto {
    private int attempted;
    private int created;
    private int skipped;
    private int failed;
    private List<String> errors = new ArrayList<>();
    private CounterpartCheckReportDto reportBefore;
    private CounterpartCheckReportDto reportAfter;
}

