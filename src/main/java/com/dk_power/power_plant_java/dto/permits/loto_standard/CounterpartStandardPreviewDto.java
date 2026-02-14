package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Data;

import java.util.List;

@Data
public class CounterpartStandardPreviewDto {
    private LotoStandardDto sourceStandard;
    private String sourceUnit;
    private String targetUnit;
    private List<CounterpartItemDto> items;

    @Data
    public static class CounterpartItemDto {
        private LotoPointDto sourcePoint;
        private LotoPointDto counterpartPoint;
        private String category; // "confirmed", "suggested", "original", "non-counterpart"
        private boolean hasMultipleMatches;
        private List<LotoPointDto> allMatches;
        private int sourceIndex;
    }
}
