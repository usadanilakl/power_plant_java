package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CounterpartCheckReportDto {
    private int totalInstruments;
    private int totalUnitTagged;
    private int pairedBaseCount;
    private int missing01Count;
    private int missing02Count;
    private List<String> missing01Tags = new ArrayList<>();
    private List<String> missing02Tags = new ArrayList<>();
}

