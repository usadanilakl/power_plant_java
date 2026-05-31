package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractorsImportRequest {
    private String source;
    private List<ContractorDto> contractors;
}
