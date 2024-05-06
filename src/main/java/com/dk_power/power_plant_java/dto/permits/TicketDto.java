package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.entities.permits.Sw;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;


@NoArgsConstructor
@AllArgsConstructor
@Data
public class TicketDto {
    private String requestor, controlAuthority,  system, workScope, equipment,createdBy;
    private Long id;
    private List<Loto> lotos;
    private List<Sw> swList;

    public TicketDto(String requestor, String controlAuthority, String system, String workScope, String equipment, String createdBy, List<Loto> lotos, List<Sw> swList) {
        this.requestor = requestor;
        this.controlAuthority = controlAuthority;
        this.system = system;
        this.workScope = workScope;
        this.equipment = equipment;
        this.createdBy = createdBy;
        this.lotos = new ArrayList<>(lotos);
        this.swList = new ArrayList<>(swList);
    }
}
