package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.permits.NgJhaDto;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class JhaMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final JhaRepo jhaRepo;

    public JhaDto convertToDto(Jha entity) {
        if (entity == null) return null;
        JhaDto dto = new JhaDto();
        dto.setId(entity.getId());
        dto.setJobName(entity.getJobName());
        dto.setApplicability(entity.getApplicability());
        dto.setAnalysisBy(entity.getAnalysisBy());
        dto.setReviewedBy(entity.getReviewedBy());
        dto.setApprovedBy(entity.getApprovedBy());
        dto.setDate(entity.getDate() != null ? entity.getDate().toString() : null);
        dto.setPpe(entity.getPpe());
        dto.setLoto(entity.getLoto());
        dto.setConfinedSpace(entity.getConfinedSpace());
        dto.setHazCom(entity.getHazCom());
        dto.setHandAndPowerTools(entity.getHandAndPowerTools());
        dto.setSpecialTools(entity.getSpecialTools());
        dto.setJobSteps(entity.getJobStepsList());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setWorkRequestSharepointId(entity.getWorkRequestSharepointId());
        dto.setTimeSubmitted(entity.getTimeSubmitted());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setSubmitterCompany(entity.getSubmitterCompany());
        return dto;
    }

    public Jha convertToEntity(JhaDto dto) {
        if (dto == null) return null;
        Jha entity = new Jha();
        entity.setJobName(dto.getJobName());
        entity.setApplicability(dto.getApplicability());
        entity.setAnalysisBy(dto.getAnalysisBy());
        entity.setReviewedBy(dto.getReviewedBy());
        entity.setApprovedBy(dto.getApprovedBy());
        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            try {
                entity.setDate(LocalDate.parse(dto.getDate()));
            } catch (Exception ignored) {}
        }
        entity.setPpe(dto.getPpe());
        entity.setLoto(dto.getLoto());
        entity.setConfinedSpace(dto.getConfinedSpace());
        entity.setHazCom(dto.getHazCom());
        entity.setHandAndPowerTools(dto.getHandAndPowerTools());
        entity.setSpecialTools(dto.getSpecialTools());
        if (dto.getJobSteps() != null) {
            entity.setJobStepsList(dto.getJobSteps());
        }
        entity.setSharepointId(dto.getSharepointId());
        return entity;
    }

    public NgJhaDto convertToNgDto(Jha entity) {
        if (entity == null) return null;
        NgJhaDto dto = new NgJhaDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setNote(entity.getNote());
        dto.setJobName(entity.getJobName());
        dto.setApplicability(entity.getApplicability());
        dto.setAnalysisBy(entity.getAnalysisBy());
        dto.setReviewedBy(entity.getReviewedBy());
        dto.setApprovedBy(entity.getApprovedBy());
        dto.setDate(entity.getDate() != null ? entity.getDate().toString() : null);
        dto.setPpe(entity.getPpe());
        dto.setLoto(entity.getLoto());
        dto.setConfinedSpace(entity.getConfinedSpace());
        dto.setHazCom(entity.getHazCom());
        dto.setHandAndPowerTools(entity.getHandAndPowerTools());
        dto.setSpecialTools(entity.getSpecialTools());
        dto.setJobSteps(entity.getJobStepsList());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setWorkRequestSharepointId(entity.getWorkRequestSharepointId());
        if (entity.getWorkRequest() != null) {
            dto.setWorkRequestId(entity.getWorkRequest().getId());
        }
        dto.setTimeSubmitted(entity.getTimeSubmitted());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setSubmitterCompany(entity.getSubmitterCompany());
        if (entity.getPermitStatus() != null && entity.getPermitStatus().getName() != null) {
            dto.setStatus(entity.getPermitStatus().getName());
        }
        return dto;
    }

    public Jha convertNgDtoToEntity(NgJhaDto dto) {
        if (dto == null) return null;
        Jha entity = new Jha();
        if (dto.getId() != null && dto.getId() != 0) {
            entity = jhaRepo.findById(dto.getId()).orElse(new Jha());
        }
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setNote(dto.getNote());
        entity.setJobName(dto.getJobName());
        entity.setApplicability(dto.getApplicability());
        entity.setAnalysisBy(dto.getAnalysisBy());
        entity.setReviewedBy(dto.getReviewedBy());
        entity.setApprovedBy(dto.getApprovedBy());
        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            try {
                entity.setDate(LocalDate.parse(dto.getDate()));
            } catch (Exception ignored) {}
        }
        entity.setPpe(dto.getPpe());
        entity.setLoto(dto.getLoto());
        entity.setConfinedSpace(dto.getConfinedSpace());
        entity.setHazCom(dto.getHazCom());
        entity.setHandAndPowerTools(dto.getHandAndPowerTools());
        entity.setSpecialTools(dto.getSpecialTools());
        if (dto.getJobSteps() != null) {
            entity.setJobStepsList(dto.getJobSteps());
        }
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setWorkRequestSharepointId(dto.getWorkRequestSharepointId());
        return entity;
    }

    /**
     * Maps SharePoint DTO to a new Jha entity (used by JhaSyncService).
     */
    public Jha fromSharePointDto(JhaDto spDto) {
        if (spDto == null) return null;
        Jha entity = new Jha();
        entity.setJobName(spDto.getJobName());
        entity.setApplicability(spDto.getApplicability());
        entity.setAnalysisBy(spDto.getAnalysisBy());
        entity.setReviewedBy(spDto.getReviewedBy());
        entity.setApprovedBy(spDto.getApprovedBy());
        if (spDto.getDate() != null && !spDto.getDate().isEmpty()) {
            try {
                entity.setDate(LocalDate.parse(spDto.getDate()));
            } catch (Exception ignored) {}
        }
        entity.setPpe(spDto.getPpe());
        entity.setLoto(spDto.getLoto());
        entity.setConfinedSpace(spDto.getConfinedSpace());
        entity.setHazCom(spDto.getHazCom());
        entity.setHandAndPowerTools(spDto.getHandAndPowerTools());
        entity.setSpecialTools(spDto.getSpecialTools());
        if (spDto.getJobSteps() != null) {
            entity.setJobStepsList(spDto.getJobSteps());
        }
        entity.setSharepointId(spDto.getSharepointId());
        entity.setLocalUuid(spDto.getLocalUuid());
        entity.setWorkRequestSharepointId(spDto.getWorkRequestSharepointId());
        entity.setTimeSubmitted(spDto.getTimeSubmitted());
        entity.setSubmitterName(spDto.getSubmitterName());
        entity.setSubmitterEmail(spDto.getSubmitterEmail());
        entity.setSubmitterPhone(spDto.getSubmitterPhone());
        entity.setSubmitterCompany(spDto.getSubmitterCompany());
        return entity;
    }

    /**
     * Updates an existing entity's fields from SharePoint data (for sync updates).
     */
    public void updateEntityFromSharePoint(Jha entity, JhaDto spDto) {
        if (entity == null || spDto == null) return;
        entity.setJobName(spDto.getJobName());
        entity.setApplicability(spDto.getApplicability());
        entity.setAnalysisBy(spDto.getAnalysisBy());
        entity.setReviewedBy(spDto.getReviewedBy());
        entity.setApprovedBy(spDto.getApprovedBy());
        if (spDto.getDate() != null && !spDto.getDate().isEmpty()) {
            try {
                entity.setDate(LocalDate.parse(spDto.getDate()));
            } catch (Exception ignored) {}
        }
        entity.setPpe(spDto.getPpe());
        entity.setLoto(spDto.getLoto());
        entity.setConfinedSpace(spDto.getConfinedSpace());
        entity.setHazCom(spDto.getHazCom());
        entity.setHandAndPowerTools(spDto.getHandAndPowerTools());
        entity.setSpecialTools(spDto.getSpecialTools());
        if (spDto.getJobSteps() != null) {
            entity.setJobStepsList(spDto.getJobSteps());
        }
        if (entity.getSubmitterName() == null && spDto.getSubmitterName() != null) {
            entity.setSubmitterName(spDto.getSubmitterName());
        }
        if (entity.getSubmitterEmail() == null && spDto.getSubmitterEmail() != null) {
            entity.setSubmitterEmail(spDto.getSubmitterEmail());
        }
        if (entity.getSubmitterPhone() == null && spDto.getSubmitterPhone() != null) {
            entity.setSubmitterPhone(spDto.getSubmitterPhone());
        }
        if (entity.getSubmitterCompany() == null && spDto.getSubmitterCompany() != null) {
            entity.setSubmitterCompany(spDto.getSubmitterCompany());
        }
        if (entity.getLocalUuid() == null && spDto.getLocalUuid() != null) {
            entity.setLocalUuid(spDto.getLocalUuid());
        }
        if (entity.getTimeSubmitted() == null && spDto.getTimeSubmitted() != null) {
            entity.setTimeSubmitted(spDto.getTimeSubmitted());
        }
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
