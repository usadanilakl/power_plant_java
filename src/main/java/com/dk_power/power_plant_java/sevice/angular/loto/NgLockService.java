package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LockDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.mappers.permits.LockMapper;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NgLockService implements NgCrudService<Lock, LockDto, LockRepo, LockMapper> {
    private final LockRepo lockRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final LockMapper lockMapper;

    @Override
    public LockRepo getRepo() {
        return this.lockRepo;
    }

    @Override
    public LockMapper getMapper() {
        return this.lockMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LockDto getDto() {
        return new LockDto();
    }

    @Override
    public Lock getEntity() {
        return new Lock();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Lock> getEntityClass() {
        return Lock.class;
    }

    public Optional<Lock> findById(Long id) {
        return lockRepo.findById(id);
    }

    public Optional<LockDto> findDtoById(Long id) {
        return Optional.ofNullable(findById(id).map(lockMapper::convertToDto).orElseThrow(() -> new RuntimeException("Lock not found")));
    }

    public Page<LockDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("number", searchString);
        // Add other search criteria fields as needed
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "number", "asc", false);
    }

    @Override
    public LockDto toDto(Lock entity) {
        return this.lockMapper.convertToDto(entity);
    }

    @Override
    public Lock toEntity(LockDto dto) {
        return this.lockMapper.convertToEntity(dto);
    }

    public List<LockDto> getLocksByLotoId(Long lotoId) {
        List<Lock> locks = lockRepo.findByLotoId(lotoId);
        return locks.stream().map(this::toDto).toList();
    }

    // Add any additional methods specific to Lock here
}