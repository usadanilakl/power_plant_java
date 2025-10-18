package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.clients.PowerAutomateClient;
import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.sql.SQLOutput;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgWorkRequestService implements NgPermitService<WorkRequest, WorkRequestDto, WorkRequestRepo, WorkRequestMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final PowerAutomateClient powerAutomateClient;
    private final NgValueService valueService;

    @Override
    public WorkRequestRepo getRepo() {
        return workRequestRepo;
    }

    @Override
    public WorkRequestMapper getMapper() {
        return workRequestMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public WorkRequestDto getDto() {
        return new WorkRequestDto();
    }

    @Override
    public WorkRequest getEntity() {
        return new WorkRequest();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<WorkRequest> getEntityClass() {
        return WorkRequest.class;
    }

    public List<WorkRequest> getAllByStatus(String status){
        if(status == null || status.isEmpty()) throw new IllegalArgumentException("Status cannot be null or empty");
        else if(status.equalsIgnoreCase("active")) downloadAndSaveNewRequests();
        List<WorkRequest> allIncomplete = workRequestRepo.findByPermitStatus_NameIgnoreCase(status);
        return allIncomplete;
    }

    public List<WorkRequestDto> getAllDtosByStatus(String status){
        return getAllByStatus(status).stream().map(workRequestMapper::convertToDto).toList();
    }

    public List<WorkRequestDto> getAndCombineLocalAndSharepointRequests() {
        downloadAndSaveNewRequests();
        return getAllDtosByStatus("Active");
    }

    public List<WorkRequest> downloadAndSaveNewRequests() {
        List<WorkRequest> saved = new ArrayList<>();
        try {
            List<WorkRequestDto> allRequests = powerAutomateClient.getAllRequests();
            if (allRequests == null) {
                // log warning about empty retrieval
                return saved;
            }
            for (WorkRequestDto r : allRequests) {
                if (r == null || r.getSharepointId() == null) {
                    // skip or log incomplete data
                    continue;
                }
                WorkRequest existing = getEntityBySharepointId(r.getSharepointId());
                String currentStatus = r.getStatus();
                if (currentStatus == null || currentStatus.isEmpty()) {
                    currentStatus = "Active";
                }
                if (existing == null) {
                    WorkRequest entity = toEntity(r);
                    entity.setPermitStatus(valueService.createValue("Permit Status", currentStatus));
                    saved.add(save(entity));
                } else {
                    String existingStatus = existing.getPermitStatus() != null ? existing.getPermitStatus().getName() : "";
                    if (!existingStatus.equalsIgnoreCase(currentStatus)) {
                        existing.setPermitStatus(valueService.createValue("Permit Status", currentStatus));
                        saved.add(save(existing));
                    }
                }

                List<WorkRequest> allIncomplete = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");

                List<WorkRequest> toClose = allIncomplete.stream()
                        .filter(workRequest -> {
                            String spId = workRequest.getSharepointId();
                            if (spId == null) return false;  // skip null ids
                            // Check if allRequests does NOT contain this spId (case-insensitive)
                            return allRequests.stream()
                                    .noneMatch(rec -> rec.getSharepointId() != null && rec.getSharepointId().equalsIgnoreCase(spId));
                        })
                        .toList();

                // Now close all those requests
                toClose.forEach(wr -> {
                    wr.setPermitStatus(valueService.createValue("Permit Status", "Closed"));
                    save(wr);
                });

            }
        } catch (Exception e) {
            // log error with context, e.g. logger.error("Failed downloading and saving work requests", e);
            // Optionally rethrow or handle recovery
        }
        return saved;
    }


    public WorkRequestDto completeWorkRequest(Long id){
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status","Closed"));
        try {
            powerAutomateClient.archiveWorkRequests(entity.getSharepointId());
        }catch (Exception e){
            e.printStackTrace();
            System.out.println(e.getMessage());
        }
        return toDto(save(entity));
    }

    public WorkRequestDto completeWorkRequestBySharepointId(String id){
        WorkRequest entity = getEntityBySharepointId(id);
        entity.setPermitStatus(valueService.createValue("Permit Status","Closed"));
        try{
            powerAutomateClient.archiveWorkRequests(id);
        }catch (Exception e){
            System.out.println(e.getMessage());
        }
        WorkRequest saved = save(entity);
        System.out.println("saved.getPermitStatus().getName() = " + saved.getPermitStatus().getName());

        return toDto(saved);
    }

    private WorkRequest getEntityBySharepointId(String id) {
        return workRequestRepo.findBySharepointId(id).orElse(null);
    }

    public boolean existsBySharepointId(String id){
        return workRequestRepo.existsBySharepointId(id);
    }

    public NgWorkRequestDto toNgWorkRequestDto(WorkRequestDto workRequestDto) {
        return workRequestMapper.toNgWorkRequestDto(workRequestDto);
    }

    public List<WorkRequest> saveAllFromDto(List<NgWorkRequestDto> workRequests) {
        return workRequests.stream().map(workRequestMapper::convertNgDtoToEntity).map(this::save).collect(Collectors.toList());
    }

    public WorkRequest archiveWorkRequest(String sharepointId){
        WorkRequest entity = getEntityBySharepointId(sharepointId);
        powerAutomateClient.archiveWorkRequests(sharepointId);
        return save(entity);
    }

    public WorkRequestDto setStatus(String id, String status) {
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status",status));
        try{
            powerAutomateClient.changeWorkRequestStatus(entity.getSharepointId(),status);
        }catch (Exception e){
            System.out.println(e.getMessage());
        }
        WorkRequest saved = save(entity);
        System.out.println("saved.getPermitStatus().getName() = " + saved.getPermitStatus().getName());

        return toDto(saved);
    }
}
