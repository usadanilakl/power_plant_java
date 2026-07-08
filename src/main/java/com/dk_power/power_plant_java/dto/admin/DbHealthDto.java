package com.dk_power.power_plant_java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Read-only snapshot of H2 database health for the admin "DB Health" tab.
 * All numeric sizes are bytes. Populated by
 * {@link com.dk_power.power_plant_java.sevice.angular.admin.DbHealthService}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DbHealthDto {

    private String dialect;            // "H2" or other; stats below are H2-only
    private String dbFilePath;         // resolved .mv.db path
    private long fileSizeBytes;        // physical .mv.db size on disk
    private long traceSizeBytes;       // .trace.db size on disk
    private long logicalBytes;         // sum of DISK_SPACE_USED across all tables
    private long deadSpaceBytes;       // max(0, fileSize - logical)
    private double deadSpacePercent;   // deadSpace / fileSize * 100
    private boolean compactRecommended;// true when dead space is high enough to defrag
    private long fieldChangeTotal;
    private String note;               // populated when stats are degraded/unavailable

    private List<TableStat> tables;        // top tables by disk usage
    private List<TableStat> auditTables;   // leftover Envers *_AUD / REVINFO (should be empty)
    private AttachmentStat attachments;
    private List<DayCount> fieldChangeByDay;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TableStat {
        private String name;
        private long bytes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttachmentStat {
        private long rowCount;
        private long distinctHashes;   // distinct content -> duplicates = rowCount - distinctHashes - nullHashCount
        private long nullHashCount;
        private long totalBytes;       // sum of base64 length
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DayCount {
        private String day;            // yyyy-MM-dd
        private long count;
    }
}
