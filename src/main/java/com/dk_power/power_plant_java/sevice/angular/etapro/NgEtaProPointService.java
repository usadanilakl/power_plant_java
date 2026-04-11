package com.dk_power.power_plant_java.sevice.angular.etapro;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.etapro.EtaProPointDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Ng-style service for EtaPro points — extends NgCrudService to get
 * complexSearch, pagination, unique column values for free.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgEtaProPointService implements NgCrudService<EtaProPoint, EtaProPointDto, EtaProPointRepo, EtaProMapper> {
    private final EtaProPointRepo repo;
    private final EtaProMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public EtaProPointRepo getRepo() { return repo; }
    @Override public EtaProMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<EtaProPoint> getEntityClass() { return EtaProPoint.class; }
    @Override public EtaProPointDto getDto() { return new EtaProPointDto(); }
    @Override public EtaProPoint getEntity() { return new EtaProPoint(); }

    /**
     * Columns searched by global search (typed into the search bar).
     */
    @Override
    public List<String> getGlobalSearchColumns() {
        return List.of("pointId", "description", "unit", "category");
    }

    public Page<EtaProPointDto> complexSearch(String searchString, int page, int size) {
        SearchCriteria sc = new SearchCriteria();
        sc.setType(SearchCriteria.SearchType.GLOBAL);
        sc.setQuery(searchString);
        sc.setGlobalFilterLogic("OR");
        return complexSearch(sc, page, size, "pointId", "asc", false);
    }

    public List<EtaProPoint> getActivePoints() {
        return repo.findByActiveTrue();
    }

    public Page<String> getFilteredUniqueValues(String column, SearchCriteria searchCriteria, int page, int pageSize, boolean andLogic) {
        return getFilteredUniqueValuesOfColumn(
                entityManager, repo, EtaProPoint.class,
                column, searchCriteria,
                PageRequest.of(page, pageSize), andLogic
        );
    }
}
