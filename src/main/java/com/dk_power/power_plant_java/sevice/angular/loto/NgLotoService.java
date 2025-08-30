package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
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
    private final LotoSnapshotRepo lotoSnapshotRepo;

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

    @Override
    public Loto save(Loto entity) {
        Set<LotoSnapshot> snapshots = entity.getSnapshots();
        if(snapshots!= null) {
            snapshots.forEach(s -> {
                if(s.getId() == null) {
                    s.setLoto(entity);
                    lotoSnapshotRepo.save(s);
                }
            });
        }
        return this.repo.save(entity);
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

        // Update Loto with new data
        mapper.updateLotoFromDto(dto, loto);

        // Handle LotoPoints
        Set<Long> newLotoPointIds = dto.getLotoPoints() != null ? new HashSet<>(dto.getLotoPoints()) : new HashSet<>();

        if (loto.getLotoPoints() == null) {
            loto.setLotoPoints(new HashSet<>());
        }

        loto.getSnapshots().forEach(s->{
            if(s.getId()==null) lotoSnapshotRepo.save(s);
        });

        return repo.save(loto);
    }

    public List<LotoPointDto> getActiveLotoPoints() {
//        return repo.findAll().stream()
//                .filter(loto -> loto.getLotoPoints() != null && !loto.getLotoPoints().isEmpty())
//                .flatMap(loto -> loto.getLotoPoints().stream())
//                .distinct()
//                .map(lotoPointService::toDto)
//                .collect(Collectors.toList());
        return null;
    }

    public LotoDto addLotoPointToLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        LotoPoint point = lotoPointService.findById(pointId)
               .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + pointId));

        loto.addLotoPoint(lotoPointService.toIdDto(point));

        return toDto(save(loto));
    }

    private LotoPointIdDto toIdDto(LotoPoint point) {
        return this.mapper.toIdDto(point);
    }

    public LotoDto removeLotoPointFromLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));


        loto.getLotoPoints().forEach(p -> {
            System.out.println(p.getTagNumber());
        });
        System.out.println("==================");

        loto.removeLotoPoint(pointId);

        loto.getLotoPoints().forEach(p -> {
            System.out.println(p.getTagNumber());
        });
        return toDto(save(loto));
    }


    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        Loto loto = getEntityById(lotoStandardId);
        if (loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        List<LotoPoint> points = loto.getLotoPoints().stream().map(lotoPointService::convertIdDtoToEntity).toList();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(lotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }

//    public LotoStandardDto reorderLotoPoints(Long currentStandardId, List<Long> lotoPoints) {
//        Loto loto = getEntityById(currentStandardId);
//        if (loto == null) {
//            throw new EntityNotFoundException("LotoStandard not found");
//        }
//        loto.reorderLotoPoints(lotoPoints);
//        LotoStandard savedStandard = save(standard);
//        return toDto(savedStandard);
//    }
}
