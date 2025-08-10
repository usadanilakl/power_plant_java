package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.mappers.permits.LotoStandardMapper;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        return new LotoStandard()  ;
    }

    @Override
    public LotoStandardDto getDto() {
        return new LotoStandardDto()  ;
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

    public LotoStandardDto addLotoPointToStandard(Long id, String lotoStandardId) {
        LotoStandard standard = getEntityById(lotoStandardId);
        LotoPoint lotoPoint = ngLotoPointService.getEntityById(id);
        standard.getLotoPoints().add(lotoPoint);
        return toDto(save(standard));
    }
}
