package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoService implements NgCrudService<Loto, LotoDto, LotoRepo, LotoMapper> {
    private final LotoMapper mapper;
    private final LotoRepo repo;
    private final EntityManager entityManager;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;
    private final NgLotoPointService lotoPointService;
    private final NgLotoBoxService lotoBoxService;
    private final NgLockService lockService;

    @Override
    public LotoRepo getRepo() {
        return this.repo;
    }

    @Override
    public LotoMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Loto> getEntityClass() {
        return Loto.class;
    }

    public Optional<Loto> findById(Long id) {
        return this.repo.findById(id);
    }

    public Optional<LotoDto> findDtoById(Long id) {
        return this.findById(id).map(this::toDto);
    }

    public Page<LotoDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("docNum", searchString);
        searchCriteria.put("workScope", searchString);
        searchCriteria.put("system.name", searchString);
        searchCriteria.put("permitStatus.name", searchString);
        searchCriteria.put("permitType.name", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
//        return complexSearch(sc).stream().map(this::toDto).toList();
        return complexSearch(sc, page, size, "socNum", "asc", false);
    }

    public Set<String> getRelatedImages(Long id) {
        return repo.findById(id)
                .map(loto -> loto.getLotoPoints().stream()
                        .map(l -> lotoPointService.getRelatedImages(l.getId()))
                        .flatMap(Collection::stream)
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

    @Override
    public Loto toEntity(LotoDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public LotoDto toDto(Loto entity) {
        return mapper.convertToDto(entity);
    }

//@Transactional
//public Loto update(LotoIdDto dto) {
//    Optional<Loto> byId = repo.findById(dto.getId());
//    List<LotoPoint> pointsToRemove = new ArrayList<>();
//    // Handle LotoPoints
//    Set<Long> newLotoPointIds = dto.getLotoPoints() != null ? new HashSet<>(dto.getLotoPoints()) : new HashSet<>();
//    if (byId.isPresent()) {
//        pointsToRemove = byId.get().getLotoPoints().stream()
//                .filter(lotoPoint -> !newLotoPointIds.contains(lotoPoint.getId()))
//                .toList();
//    }
//
//    Loto existingLoto = this.mapper.convertIdDtoToEntity(dto);
//    existingLoto = repo.save(existingLoto);
//    final Loto finalExistingLoto = existingLoto;
//
//    // Handle LotoBox
//    if (finalExistingLoto.getLotoBox() != null) {
//        lotoBoxService.save(finalExistingLoto.getLotoBox());
//    }
//
//    // Handle Locks
//    if (finalExistingLoto.getLocks() != null) {
//        finalExistingLoto.getLocks().forEach(lock -> {
//            if (lock != null) {
//                lock.setLoto(finalExistingLoto);
//                lockService.save(lock);
//            }
//        });
//    }
//
//    pointsToRemove.forEach(lotoPoint -> {
//        lotoPoint.removeLoto(finalExistingLoto);
//        finalExistingLoto.getLotoPoints().remove(lotoPoint);
//        lotoPointService.save(lotoPoint);
//    });
//
//    // Add or update LotoPoints
//    newLotoPointIds.forEach(id -> {
//        LotoPoint lotoPoint = lotoPointService.findById(id)
//                .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + id));
//        
//        if (!finalExistingLoto.getLotoPoints().contains(lotoPoint)) {
//            finalExistingLoto.getLotoPoints().add(lotoPoint);
//            lotoPoint.addLoto(finalExistingLoto);
//        }
//        lotoPointService.save(lotoPoint);
//    });
//
//    return repo.save(finalExistingLoto);
//}

@Transactional
public void removeLotoPointsFromLoto(Loto loto, Set<Long> lotoPointIdsToRemove) {
    if (loto == null || lotoPointIdsToRemove == null || lotoPointIdsToRemove.isEmpty()) {
        return;
    }

    Set<LotoPoint> pointsToRemove = loto.getLotoPoints().stream()
            .filter(point -> lotoPointIdsToRemove.contains(point.getId()))
            .collect(Collectors.toSet());

    for (LotoPoint point : pointsToRemove) {
        point.getLotos().remove(loto);
        loto.getLotoPoints().remove(point);
        lotoPointService.save(point);
    }

    repo.save(loto);
}

@Transactional
public void addLotoPointsToLoto(Loto loto, Set<Long> lotoPointIdsToAdd) {
    if (loto == null || lotoPointIdsToAdd == null || lotoPointIdsToAdd.isEmpty()) {
        return;
    }

    for (Long id : lotoPointIdsToAdd) {
        LotoPoint lotoPoint = lotoPointService.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + id));
        
        if (!loto.getLotoPoints().contains(lotoPoint)) {
            loto.getLotoPoints().add(lotoPoint);
            lotoPoint.addLoto(loto);
            lotoPointService.save(lotoPoint);
        }
    }

    repo.save(loto);
}

@Transactional
public Loto update(LotoIdDto dto) {
    Loto loto;
    boolean isNewLoto = dto.getId() == null || dto.getId() == 0;

    if (isNewLoto) {
        loto = new Loto();
    } else {
        loto = repo.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + dto.getId()));
    }

    Set<Long> newLotoPointIds = dto.getLotoPoints() != null ? new HashSet<>(dto.getLotoPoints()) : new HashSet<>();

    if (!isNewLoto) {
        if (loto.getLotoPoints() != null) {
            // Remove LotoPoints that are no longer associated
            Set<Long> lotoPointIdsToRemove = loto.getLotoPoints().stream()
                    .map(LotoPoint::getId)
                    .filter(id -> !newLotoPointIds.contains(id))
                    .collect(Collectors.toSet());
            removeLotoPointsFromLoto(loto, lotoPointIdsToRemove);
        } else {
            loto.setLotoPoints(new ArrayList<>());
        }

        // Refresh the loto entity
        loto = repo.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + dto.getId()));
    } else {
        loto.setLotoPoints(new ArrayList<>());
    }

    // Update Loto with new data
    mapper.updateLotoFromDto(dto, loto);

    // Create a final reference to loto for use in the lambda
    final Loto finalLoto = loto;

    // Add new LotoPoints
    Set<Long> lotoPointIdsToAdd = newLotoPointIds.stream()
            .filter(id -> finalLoto.getLotoPoints() == null || 
                          finalLoto.getLotoPoints().stream().map(LotoPoint::getId).noneMatch(id::equals))
            .collect(Collectors.toSet());
    addLotoPointsToLoto(finalLoto, lotoPointIdsToAdd);

    // Handle LotoBox
    if (finalLoto.getLotoBox() != null) {
        lotoBoxService.save(finalLoto.getLotoBox());
    }

    // Handle Locks
    if (finalLoto.getLocks() != null) {
        for (var lock : finalLoto.getLocks()) {
            if (lock != null) {
                lock.setLoto(finalLoto);
                lockService.save(lock);
            }
        }
    }

    return repo.save(finalLoto);
}
    public List<LotoPointDto> getActiveLotoPoints() {
        return repo.findAll().stream()
                .filter(loto -> loto.getLotoPoints() != null && !loto.getLotoPoints().isEmpty())
                .flatMap(loto -> loto.getLotoPoints().stream())
                .distinct()
                .map(lotoPointService::toDto)
                .collect(Collectors.toList());
    }
}
