package com.dk_power.power_plant_java.dto.permits.loto_point;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class BulkSearchResultDto {
    private String searchText;
    private List<BulkSearchMatchDto> exactMatches;
    private List<BulkSearchMatchDto> duplicateMatches;
    private List<BulkSearchMatchDto> partialMatches;
    private List<String> notFound;
    private int totalDetectedTags;
}
