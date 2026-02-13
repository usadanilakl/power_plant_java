package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.permits.NgJhaDto;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.mappers.permits.JhaMapper;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NgJhaService implements NgPermitService<Jha, JhaDto, JhaRepo, JhaMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final JhaRepo jhaRepo;
    private final JhaMapper jhaMapper;
    private final NgValueService valueService;

    @Override
    public JhaRepo getRepo() {
        return jhaRepo;
    }

    @Override
    public JhaMapper getMapper() {
        return jhaMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public JhaDto getDto() {
        return new JhaDto();
    }

    @Override
    public Jha getEntity() {
        return new Jha();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<Jha> getEntityClass() {
        return Jha.class;
    }

    // ====================== CRUD ======================

    public List<Jha> getAllByStatus(String status) {
        if (status == null || status.isEmpty()) throw new IllegalArgumentException("Status cannot be null or empty");
        return jhaRepo.findByPermitStatus_NameIgnoreCase(status);
    }

    public List<NgJhaDto> getAllNgDtosByStatus(String status) {
        return getAllByStatus(status).stream().map(jhaMapper::convertToNgDto).toList();
    }

    public NgJhaDto getNgDtoById(Long id) {
        Jha entity = getEntityById(id);
        return jhaMapper.convertToNgDto(entity);
    }

    public NgJhaDto saveFromDto(NgJhaDto dto) {
        Jha entity = jhaMapper.convertNgDtoToEntity(dto);
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            entity.setPermitStatus(valueService.createValue("Permit Status", dto.getStatus()));
        }
        if (entity.getCreatedBy() == null) {
            entity.setCreatedBy(dto.getSubmitterName() != null ? dto.getSubmitterName() : "System");
        }
        Jha saved = save(entity);
        return jhaMapper.convertToNgDto(saved);
    }

    public List<NgJhaDto> getByWorkRequestId(Long workRequestId) {
        return jhaRepo.findByWorkRequestId(workRequestId).stream()
                .map(jhaMapper::convertToNgDto).toList();
    }

    // ====================== Unique Values ======================

    public Page<String> getUniqueValuesFiltered(
            JhaRepo repo, String columnName, SearchCriteria searchCriteria,
            int page, int pageSize, boolean andLogic) {
        Pageable pageable = PageRequest.of(page, pageSize);
        return getFilteredUniqueValuesOfColumn(entityManager, repo, Jha.class, columnName, searchCriteria, pageable, andLogic);
    }

    // ====================== Status Changes ======================

    public NgJhaDto setStatus(Long id, String status) {
        Jha entity = getEntityById(id);
        entity.setPermitStatus(valueService.createValue("Permit Status", status));
        Jha saved = save(entity);
        return jhaMapper.convertToNgDto(saved);
    }
}
