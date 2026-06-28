package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/**
 * An actual-material transaction (matusetrans) on a work order — an ISSUE or a RETURN.
 * Quantity is signed as Maximo stores it (issue negative, return positive); linecost likewise
 * (issue positive charge, return negative credit).
 */
@Data
public class MaximoMaterialTxnDto {
    private Long matusetransid;
    private String itemnum;
    private String description;
    private String issuetype;   // ISSUE / RETURN
    private String storeloc;
    private String issueunit;
    private Double quantity;
    private Double linecost;
}
