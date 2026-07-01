package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/**
 * One material-use transaction for an inventory item (mxapiinventory/{id}/matusetrans): which WO consumed
 * it, quantity (negative = issue, positive = return), when, and the line cost. For the item usage history.
 */
@Data
public class MaximoInventoryUsageDto {
    private String wonum;
    private Double quantity;
    private String transdate;
    private String issuetype;   // ISSUE / RETURN
    private Double linecost;
}
