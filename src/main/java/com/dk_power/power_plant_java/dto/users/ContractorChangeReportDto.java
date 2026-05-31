package com.dk_power.power_plant_java.dto.users;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContractorChangeReportDto {

    private Long id;
    private LocalDateTime runAt;
    private String status;
    private String source;
    private String summary;
    private LocalDateTime acceptedAt;
    private String acceptedBy;
    private List<ContractorDto> added;
    private List<ContractorDto> removed;
    private List<ContractorChange> changed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractorChange {
        private String onLocationMemberId;
        private ContractorDto before;
        private ContractorDto after;
    }
}
