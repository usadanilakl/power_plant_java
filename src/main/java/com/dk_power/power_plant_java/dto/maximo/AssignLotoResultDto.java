package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.dto.permits.LotoLinkDto;

import java.util.List;

/**
 * Result of a bulk LOTO-assign: how many WOs were newly linked vs already linked, how many "Covered by LOTO"
 * worklog comments made it into Maximo, which ones failed (best-effort — a comment failure never rolls back the
 * structured link), and the refreshed LOTO link summary.
 */
public record AssignLotoResultDto(
        int newlyLinked,
        int alreadyLinked,
        int commentsWritten,
        List<String> commentFailures,
        LotoLinkDto loto
) {}
