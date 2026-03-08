package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

@Data
public class InstrumentLogDto {
    private Long id;
    private String instrumentTagNumber;
    private String instrumentDescription;
    private String status;
    private String date;
    private String time;
    private String name;
    private String comment;
    private String sharepointId;
    private String localUuid;
}
