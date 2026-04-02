package com.dk_power.power_plant_java.dto.sync;

import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkRequestHealSnapshotDto {
    @Builder.Default
    private List<NgWorkRequestDto> items = new ArrayList<>();
    private boolean sharePointAvailable;
    private int repairedCreateHistory;
    private int importedFromSharePoint;
    private int localCount;
    private String message;
}
