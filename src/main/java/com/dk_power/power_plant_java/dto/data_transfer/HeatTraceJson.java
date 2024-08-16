package com.dk_power.power_plant_java.dto.data_transfer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HeatTraceJson {
    private String breaker;
    private String to;
    private String panel;
    private String htt;
    private String line;
    private String pid;
    private String isoLink;
    private String pdLink;
    private String location;
}