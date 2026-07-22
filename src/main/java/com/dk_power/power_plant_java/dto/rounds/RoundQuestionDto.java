package com.dk_power.power_plant_java.dto.rounds;

public record RoundQuestionDto(
        Long id,
        Long roundId,
        Integer orderIndex,
        String prompt,
        String answerType,
        Long physicalObjectId,
        String tagCode,
        String unit,
        Double lowLimit,
        Double highLimit,
        String expectedValue,
        boolean trackIssues,
        String choicesJson,
        String category,
        String sourceWebviewKey,
        Long predecessorQuestionId,
        String showWhenOp,
        String showWhenValue,
        String reorderCatalogKey
) {}
