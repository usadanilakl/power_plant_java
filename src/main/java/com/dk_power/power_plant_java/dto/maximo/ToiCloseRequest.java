package com.dk_power.power_plant_java.dto.maximo;

/** Close a TOI/TMOD: who closed it + closing comments. Recorded as a closure worklog note. */
public record ToiCloseRequest(String closedBy, String comments) {}
