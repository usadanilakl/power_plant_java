package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A dry-run render of an order email — exactly what would be sent (including any test-mode recipient override). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPreviewDto {
    private String to;
    private String cc;
    private String subject;
    private String poNumber;
    private String bodyHtml;
}
