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
//        List<WorkRequest> active = getAllByStatus("Active");
//        List<WorkRequest> allRequests = powerAutomateClient.getAllRequests().stream()
//                .map(workRequestMapper::convertToEntity)
//                .toList();
//
//        // Combine both lists
//        List<WorkRequest> combined = new ArrayList<>();
//        combined.addAll(active);
//        combined.addAll(allRequests);
//
//        // Use a map keyed by sharepointId to remove duplicates
//        Map<String, WorkRequest> uniqueMap = combined.stream()
//                .filter(wr -> wr.getSharepointId() != null) // ensure no null keys
//                .collect(Collectors.toMap(
//                        WorkRequest::getSharepointId,
//                        wr -> wr,
//                        (existing, replacement) -> existing // keep the existing one if duplicate found
//                ));
//
//        // Convert unique values back to DTO list
//        return uniqueMap.values().stream()
//                .map(workRequestMapper::convertToDto)
//                .toList();
    }

    public List<WorkRequest> downloadAndSaveNewRequests(){
        List<WorkRequestDto> allRequests = powerAutomateClient.getAllRequests();
        List<WorkRequest> saved = new ArrayList<>();
        for (WorkRequestDto r : allRequests) {
            if(!existsBySharepointId(r.getSharepointId())){
                WorkRequest entity = toEntity(r);
                entity.setPermitStatus(valueService.createValue("Permit Status","Active"));
                saved.add(save(entity));
            }
        }
        return saved;
    }

    public WorkRequestDto completeWorkRequest(Long id){
        WorkRequest entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status","Closed"));
        powerAutomateClient.archiveWorkRequests(entity.getSharepointId());
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

}
