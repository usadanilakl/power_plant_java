package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class MergeRequest {
    private Long keepId;
    private Long removeId;         // single merge (legacy)
    private List<Long> removeIds;  // batch merge
}
