package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** Outcome of a reorder-email send (or a dry-run preview). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderResultDto {
    /** True when the vendor email was actually sent. */
    private boolean sent;
    private String message;
    private String recipient;
    private String cc;
    private String poNumber;
    /** Maximo doclink href of the attached order summary (null if not attached). */
    private String doclinkId;
    @Builder.Default
    private List<ReorderLineDto> lines = new ArrayList<>();
}
