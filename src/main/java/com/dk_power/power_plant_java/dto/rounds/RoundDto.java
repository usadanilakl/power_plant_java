package com.dk_power.power_plant_java.dto.rounds;

import java.util.List;

public record RoundDto(
        Long id,
        String name,
        String description,
        String area,
        String cadence,
        String shift,
        Integer intervalHours,
        boolean active,
        String sourceTemplate,
        int questionCount,
        List<RoundQuestionDto> questions
) {}
