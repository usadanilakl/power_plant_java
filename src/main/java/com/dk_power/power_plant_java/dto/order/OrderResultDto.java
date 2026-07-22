package com.dk_power.power_plant_java.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** Outcome of composing + sending a vendor order email. Provider-neutral (no Maximo doclink — that's a caller concern). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResultDto {
    /** True when the vendor email was actually sent. */
    private boolean sent;
    private String message;
    private String recipient;
    private String cc;
    private String poNumber;
    @Builder.Default
    private List<OrderLineDto> lines = new ArrayList<>();
}
