package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/**
 * Full stock detail for one inventory item at a storeroom (mxapiinventory): on-hand + reserved balance,
 * reorder/min/max levels, order qty, unit cost, and usage stats (issued YTD + prior 3 years). {@code href}
 * is the inventory record id (used to fetch its usage transactions). For the inventory stock-lookup page.
 */
@Data
public class MaximoInventoryStockDto {
    private String href;
    private String itemnum;
    private String storeroom;   // spi:location
    private String issueunit;
    private String status;
    private Double curbal;       // on hand
    private Double reservedqty;
    private Double minlevel;
    private Double maxlevel;
    private Double reorder;      // reorder point
    private Double orderqty;
    private Double invcost;      // unit cost
    private Double issueytd;
    private Double issue1yrago;
    private Double issue2yrago;
    private Double issue3yrago;
}
