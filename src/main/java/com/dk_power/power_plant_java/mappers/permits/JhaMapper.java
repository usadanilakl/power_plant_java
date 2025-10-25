package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.pojo.JobStep;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Component
public class JhaMapper {

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public JhaDto toDto(Jha jha) {
        if (jha == null) {
            return null;
        }

        JhaDto dto = new JhaDto();
        dto.setId(jha.getId());
        dto.setJobName(jha.getJobName());
        dto.setApplicability(jha.getApplicability());
        dto.setAnalysisBy(jha.getAnalysisBy());
        dto.setReviewedBy(jha.getReviewedBy());
        dto.setApprovedBy(jha.getApprovedBy());
        dto.setDate(jha.getDate() != null ? jha.getDate().format(DATE_FORMATTER) : null);
        dto.setPpe(jha.getPpe());
        dto.setLoto(jha.getLoto());
        dto.setConfinedSpace(jha.getConfinedSpace());
        dto.setHazCom(jha.getHazCom());
        dto.setHandAndPowerTools(jha.getHandAndPowerTools());
        dto.setSpecialTools(jha.getSpecialTools());
        dto.setSharepointId(jha.getSharepointId());

        // Deserialize stored JSON into a list of JobSteps
        if (jha.getJobSteps() != null) {
            try {
                dto.setJobSteps(jha.getJobSteps());
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize jobSteps JSON", e);
            }
        }

        return dto;
    }

    public Jha toEntity(JhaDto jhaDto) {
        if (jhaDto == null) {
            return null;
        }

        Jha entity = new Jha();
        entity.setId(jhaDto.getId());
        entity.setJobName(jhaDto.getJobName());
        entity.setApplicability(jhaDto.getApplicability());
        entity.setAnalysisBy(jhaDto.getAnalysisBy());
        entity.setReviewedBy(jhaDto.getReviewedBy());
        entity.setApprovedBy(jhaDto.getApprovedBy());
        entity.setDate(jhaDto.getDate() != null ? LocalDate.parse(jhaDto.getDate(), DATE_FORMATTER) : null);
        entity.setPpe(jhaDto.getPpe());
        entity.setLoto(jhaDto.getLoto());
        entity.setConfinedSpace(jhaDto.getConfinedSpace());
        entity.setHazCom(jhaDto.getHazCom());
        entity.setHandAndPowerTools(jhaDto.getHandAndPowerTools());
        entity.setSpecialTools(jhaDto.getSpecialTools());
        entity.setSharepointId(jhaDto.getSharepointId());

        // Serialize jobSteps list into JSON text
        if (jhaDto.getJobSteps() != null && !jhaDto.getJobSteps().isEmpty()) {
            try {
                entity.setJobSteps(jhaDto.getJobSteps());
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize jobSteps list", e);
            }
        }

        return entity;
    }
}
