package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.mappers.permits.SafeWorkMapper;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class NgSafeWorkService implements NgCrudService<SafeWork, SafeWorkDto, SafeWorkRepo, SafeWorkMapper> {
    private final SafeWorkRepo safeWorkRepo;
    private final SafeWorkMapper safeWorkMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    @Override
    public SafeWorkRepo getRepo() {
        return safeWorkRepo;
    }

    @Override
    public SafeWorkMapper getMapper() {
        return safeWorkMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public SafeWorkDto getDto() {
        return new SafeWorkDto();
    }

    @Override
    public SafeWork getEntity() {
        return new SafeWork();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<SafeWork> getEntityClass() {
        return SafeWork.class;
    }

    @Override
    public SafeWork save(SafeWorkDto dto) {
        SafeWork sw = safeWorkMapper.convertToEntity(dto);
        return safeWorkRepo.save(sw);
    }

    public SafeWorkDto createSafeWork(SafeWorkDto safeWorkDto) {
        SafeWork safeWork = safeWorkMapper.convertToEntity(safeWorkDto);
        SafeWork saved = safeWorkRepo.save(safeWork);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = safeWorkRepo.save(saved);
        }
        return safeWorkMapper.convertToDto(saved);
    }

    @Override
    public List<SafeWorkDto> getAllDtos() {
        return getAll().stream().map(safeWorkMapper::convertToDto).toList();
    }

    public List<SafeWorkDto> saveAll(List<SafeWorkDto> permits) {
        return permits.stream().map(safeWorkMapper::convertToEntity).map(safeWorkRepo::save).map(safeWorkMapper::convertToDto).toList();
    }
}
