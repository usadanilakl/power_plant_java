
package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.ZeroEnergyMapper;
import com.dk_power.power_plant_java.repository.loto.ZeroEnergyRepo;
import com.dk_power.power_plant_java.sevice.angular.base.FuzzySearchService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NgZeroEnergyService implements NgCrudService<ZeroEnergy, ZeroEnergyDto, ZeroEnergyRepo, ZeroEnergyMapper> {
    private final ZeroEnergyRepo zeroEnergyRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ZeroEnergyMapper zeroEnergyMapper;
    private final FuzzySearchService fuzzySearchService;

    @Override
    public ZeroEnergyRepo getRepo() {
        return this.zeroEnergyRepo;
    }

    @Override
    public ZeroEnergyMapper getMapper() {
        return this.zeroEnergyMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public ZeroEnergyDto getDto() {
        return new ZeroEnergyDto();
    }

    @Override
    public ZeroEnergy getEntity() {
        return new ZeroEnergy();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<ZeroEnergy> getEntityClass() {
        return ZeroEnergy.class;
    }

    public Optional<ZeroEnergy> findById(Long id) {
        return zeroEnergyRepo.findById(id);
    }

    public Optional<ZeroEnergyDto> findDtoById(Long id) {
        return findById(id).map(zeroEnergyMapper::convertToDto);
    }

    public Page<ZeroEnergyDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("method", searchString);
        searchCriteria.put("resolvedMethod", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "method", "asc", false);
    }

    @Override
    public ZeroEnergyDto toDto(ZeroEnergy entity) {
        return this.zeroEnergyMapper.convertToDto(entity);
    }

    @Override
    public ZeroEnergy toEntity(ZeroEnergyDto dto) {
        return this.zeroEnergyMapper.convertToEntity(dto);
    }

    public ZeroEnergy convertIdDtoToEntity(ZeroEnergyIdDto zeroEnergyIdDto) {
        return getMapper().convertIdDtoToEntity(zeroEnergyIdDto);
    }

    @Transactional
    public ZeroEnergy processZeroEnergy(ZeroEnergyIdDto zeroEnergyIdDto) {
        System.out.println("Processing ZeroEnergy");
        ZeroEnergy entity = convertIdDtoToEntity(zeroEnergyIdDto);
        entity = zeroEnergyRepo.save(entity);
        Long savedZeId = entity.getId();
        return getEntityById(savedZeId);
    }

    public ZeroEnergyIdDto toIdDto(ZeroEnergy zeroEnergy) {
        return this.zeroEnergyMapper.convertToIdDto(zeroEnergy);
    }

    public List<String> getUniqueValuesOfColumn(String column) {
        return this.getUniqueValuesOfColumn(zeroEnergyRepo, column);
    }

    public Page<ZeroEnergyDto> getFilteredUniqueValuesOfColumn(
            String column, String filter, int page, int pageSize) {

        Pageable pageable = PageRequest.of(page - 1, pageSize);
        Page<ZeroEnergy> entities = this.getFilteredUniqueValuesOfColumn(
                zeroEnergyRepo, column, filter, pageable);

        // Convert preserving pagination metadata
        List<ZeroEnergyDto> dtos = entities.getContent().stream()
                .map(zeroEnergyMapper::convertToDto)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }

    public Page<String> getFilteredUniqueValuesOfColumn2(String columnName, SearchCriteria searchCriteria, int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        return getFilteredUniqueValuesOfColumn(entityManager, zeroEnergyRepo, ZeroEnergy.class, columnName, searchCriteria, pageable, andLogic);
    }

//    public Page<String> getFilteredUniqueValuesOfColumn(
//            String columnName, Map<String, String> filters, int page, int pageSize, boolean andLogic) {
//        Pageable pageable = PageRequest.of(page - 1, pageSize);
//
//        // Extract only the filters you actually use (null-safe)
//        String method = filters.get("method");
//        String resolvedMethod = filters.get("resolvedMethod");
//        String templateLotoPointId = filters.get("templateLotoPointId");
//        String zeroEnergyTemplateId = filters.get("zeroEnergyTemplateId");
//
//        return switch (columnName.toLowerCase()) {
//            case "method" -> zeroEnergyRepo.findDistinctMethod(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "resolvedmethod" -> zeroEnergyRepo.findDistinctResolvedMethod(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "templatelotopointid" -> zeroEnergyRepo.findDistinctTemplateLotoPointId(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            case "zeroenergyttemplateid" -> zeroEnergyRepo.findDistinctZeroEnergyTemplateId(method, resolvedMethod, templateLotoPointId, zeroEnergyTemplateId, andLogic, pageable);
//
//            default -> new PageImpl<>(new ArrayList<>(), pageable, 0);
//        };
//    }
//
//    public Page<ZeroEnergyDto> complexSearch(SearchCriteria searchCriteria, int page, int size, String sortBy, String sortDirection, boolean andLogic) {
//        Pageable pageable = PageRequest.of(page - 1, size);
//        Page<ZeroEnergy> entities = complexSearch(searchCriteria, pageable, sortBy, sortDirection, andLogic);
//
//        List<ZeroEnergyDto> dtos = entities.getContent().stream()
//                .map(zeroEnergyMapper::convertToDto)
//                .filter(Objects::nonNull)
//                .collect(Collectors.toList());
//
//        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
//    }

    private String[] splitIntoWords(String text, int maxWords) {
        String[] words = new String[maxWords];
        if (text != null) {
            String[] textWords = text.split("\\s+");
            System.arraycopy(textWords, 0, words, 0, Math.min(textWords.length, maxWords));
        }
        return words;
    }
}
