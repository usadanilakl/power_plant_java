package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.LotoSnapshotDto;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.mappers.permits.LotoSnapshotMapper;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgLotoSnapshotService implements NgCrudService<LotoSnapshot, LotoSnapshotDto, LotoSnapshotRepo, LotoSnapshotMapper> {
    private final LotoSnapshotRepo lotoSnapshotRepo;
    private final LotoSnapshotMapper lotoSnapshotMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public LotoSnapshotRepo getRepo() {
        return lotoSnapshotRepo;
    }

    @Override
    public LotoSnapshotMapper getMapper() {
        return lotoSnapshotMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LotoSnapshotDto getDto() {
        return new LotoSnapshotDto();
    }

    @Override
    public LotoSnapshot getEntity() {
        return new LotoSnapshot();
    }

    @Override
    public LotoSnapshot toEntity(LotoSnapshotDto dto) {
        return lotoSnapshotMapper.convertToEntity(dto);
    }

    @Override
    public LotoSnapshotDto toDto(LotoSnapshot entity) {
        return lotoSnapshotMapper.convertToDto(entity);
    }

    @Override
    public Class<LotoSnapshot> getEntityClass() {
        return LotoSnapshot.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
