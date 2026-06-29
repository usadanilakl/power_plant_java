package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/** Add a worklog note to a work order (works on a completed WO too). */
@Data
public class AddWorklogRequest {
    private String summary;   // worklog short description
    private String details;   // worklog long description (optional)
    private String logtype;   // defaults to CLIENTNOTE server-side
}
