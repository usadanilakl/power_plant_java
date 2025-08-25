package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.permits.LotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class NgLotoStandardService implements NgCrudService<LotoStandard, LotoStandardDto, LotoStandardRepo, LotoStandardMapper> {
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoStandardMapper lotoStandardMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final NgLotoPointService ngLotoPointService;

    public NgLotoStandardService(LotoStandardRepo lotoStandardRepo, LotoStandardMapper lotoStandardMapper, SessionFactory sessionFactory, EntityManager entityManager, NgLotoPointService ngLotoPointService) {
        this.lotoStandardRepo = lotoStandardRepo;
        this.lotoStandardMapper = lotoStandardMapper;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.ngLotoPointService = ngLotoPointService;
    }

    @Override
    public LotoStandard getEntity() {
        return new LotoStandard();
    }

    @Override
    public LotoStandardDto getDto() {
        return new LotoStandardDto();
    }

    @Override
    public LotoStandardRepo getRepo() {
        return lotoStandardRepo;
    }

    @Override
    public LotoStandardMapper getMapper() {
        return lotoStandardMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LotoStandard toEntity(LotoStandardDto dto) {
        return lotoStandardMapper.convertToEntity(dto);
    }

    @Override
    public LotoStandardDto toDto(LotoStandard entity) {
        return lotoStandardMapper.convertToDto(entity);
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<LotoStandard> getEntityClass() {
        return LotoStandard.class;
    }

    @Override
    public List<LotoStandardDto> getAllDtos() {
        return lotoStandardRepo.findAll().stream().map(lotoStandardMapper::convertToDto).toList();
    }

    public LotoStandardDto createStandard(LotoStandardIdDto standard) {
        LotoStandard standardEntity = lotoStandardMapper.convertIdDtoToEntity(standard);
        lotoStandardRepo.save(standardEntity);
        return lotoStandardMapper.convertToDto(standardEntity);
    }


    @Transactional
    public LotoStandardDto addLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            // Check if the LotoPoint is already in the standard
            if (!standard.getLotoPoints().contains(lotoPoint)) {
                standard.addLotoPoint(lotoPoint);
                lotoPoint.addLotoStandard(standard);
            }

            LotoStandard savedStandard = save(standard);
            return toDto(savedStandard);
        } catch (Exception e) {
            throw new RuntimeException("Error adding LotoPoint to LotoStandard: " + e.getMessage(), e);
        }
    }

    @Transactional
    public LotoStandardDto removeLotoPointToStandard(Long lotoPointId, String lotoStandardId) {
        try {
            LotoStandard standard = getEntityById(lotoStandardId);
            LotoPoint lotoPoint = ngLotoPointService.getEntityById(lotoPointId);

            if (standard == null || lotoPoint == null) {
                throw new EntityNotFoundException("LotoStandard or LotoPoint not found");
            }

            // Check if the LotoPoint is already in the standard
            if (standard.getLotoPoints().contains(lotoPoint)) {
                standard.removeLotoPoint(lotoPoint);
                lotoPoint.removeStandard(standard);
            }

            LotoStandard savedStandard = save(standard);
            return toDto(savedStandard);
        } catch (Exception e) {
            throw new RuntimeException("Error removing LotoPoint from LotoStandard: " + e.getMessage(), e);
        }
    }

    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        LotoStandard standard = getEntityById(lotoStandardId);
        if (standard == null) {
            throw new EntityNotFoundException("LotoStandard not found");
        }
        Set<LotoPoint> points = standard.getLotoPoints();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(ngLotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }
}
