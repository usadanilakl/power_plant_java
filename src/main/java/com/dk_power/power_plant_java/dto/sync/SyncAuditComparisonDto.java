package com.dk_power.power_plant_java.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncAuditComparisonDto {
    private String entityType;
    private Long entityId;
    private Map<String, String> localEntity;
    private Map<String, String> serverEntity;
    private List<FieldChangeDto> localChanges;
    private List<FieldChangeDto> serverChanges;
    private List<FieldDiffEntry> diffs;
    private boolean localExists;
    private boolean serverExists;
    private boolean serverReachable;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldDiffEntry {
        private String fieldName;
        private String localValue;
        private String serverValue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityTypeSummary {
        private String entityType;
        private long localCount;
        private long changeCount;
    }
}
