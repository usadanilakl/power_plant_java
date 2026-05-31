package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Wire shape pushed by the Electron renderer after parsing the SharePoint Ops
 * Schedule Excel. Electron sends person-rows (its native parse output); the
 * backend pivots into per-day {@link ShiftDayDto} rows.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleImportRequest {
    private Integer year;
    private String source;
    private List<PersonSchedule> persons;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonSchedule {
        private String name;
        private String group;
        private List<DayCode> schedule;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayCode {
        private LocalDate date;
        private String shift;
    }
}
