package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoBoxDto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.permits.LotoBoxMapper;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
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
public class NgLotoBoxService implements NgCrudService<LotoBox, LotoBoxDto, LotoBoxRepo, LotoBoxMapper> {
    private final LotoBoxRepo lotoBoxRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final LotoBoxMapper lotoBoxMapper;

    @Override
    public LotoBoxRepo getRepo() {
        return this.lotoBoxRepo;
    }

    @Override
    public LotoBoxMapper getMapper() {
        return this.lotoBoxMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoBoxDto getDto() {
        return new LotoBoxDto();
    }

    @Override
    public LotoBox getEntity() {
        return new LotoBox();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<LotoBox> getEntityClass() {
        return LotoBox.class;
    }

    public Optional<LotoBox> findById(Long id) {
        return lotoBoxRepo.findById(id);
    }

    public Optional<LotoBoxDto> findDtoById(Long id) {
        return findById(id).map(lotoBoxMapper::convertToDto);
    }

    public Page<LotoBoxDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("number", searchString);
        // Add other search criteria fields as needed
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "number", "asc", false);
    }

    @Override
    public LotoBoxDto toDto(LotoBox entity) {
        return this.lotoBoxMapper.convertToDto(entity);
    }

    @Override
    public LotoBox toEntity(LotoBoxDto dto) {
        return this.lotoBoxMapper.convertToEntity(dto);
    }


    // Add any additional methods specific to LotoBox here
}