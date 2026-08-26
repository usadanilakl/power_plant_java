package com.dk_power.power_plant_java.dto.maximo;

/** Edit a TOI/TMOD's work-order fields: title (description), instructions (long description), location, asset. */
public record ToiUpdateRequest(String title, String instructions, String location, String assetnum, String worktype) {}
