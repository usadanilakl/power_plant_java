package com.dk_power.power_plant_java.dto.users;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContractorDto {
    private Long userId;
    private String onLocationMemberId;
    private String name;
    private String email;
    private String phone;
    private String company;
    private String title;
    /** OnLocation membership/training start date (ISO yyyy-MM-dd). */
    private String validFrom;
    /** OnLocation membership/training expiry date (ISO yyyy-MM-dd). */
    private String validTo;
    /** OnLocation member status (typically "active" / "inactive"). */
    private String status;
}
