package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoWorklogDto {
    private String href;
    private Long worklogid;
    private String description;
    private String longDescription;
    private String logtype;             // e.g. CLIENTNOTE, WORKLOG, UPDATE
    private String logtypeDescription;
    private String createby;
    private String createdate;
    private String modifyby;
    private String modifydate;
    private Boolean clientviewable;
    private String recordkey;           // wonum or ticketid this worklog is attached to
}
