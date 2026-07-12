package com.dk_power.power_plant_java.dto.rounds;

public record ImportedRoundQuestionDto(
        Long id,
        String sourceWebviewKey,
        String sourceRaw,
        String category,
        String tagCode,
        String prompt,
        Double lowLimit,
        Double highLimit,
        String unit,
        String suggestedType,
        String status,
        Long generatedQuestionId,
        boolean changedSinceProcessed
) {}
