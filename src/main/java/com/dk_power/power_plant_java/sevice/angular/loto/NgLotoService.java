package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
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
                        .flatMap(set -> set.stream())
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
}
