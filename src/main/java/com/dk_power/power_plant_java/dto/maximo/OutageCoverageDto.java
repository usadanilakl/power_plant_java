package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.dto.permits.LotoLinkDto;

import java.util.List;

/**
 * Payload for the Outage Items page: the outage work orders (each enriched with LOTO-coverage flags) plus the
 * catalog of non-closed LOTOs. The frontend groups WOs under a LOTO by matching {@code item.coveringLotoIds}
 * against {@code lotos[].id}, and drives the LOTO picker for bulk-assign from the same {@code lotos} list.
 */
public record OutageCoverageDto(
        List<MaximoWorkOrderDto> items,
        List<LotoLinkDto> lotos
) {}
