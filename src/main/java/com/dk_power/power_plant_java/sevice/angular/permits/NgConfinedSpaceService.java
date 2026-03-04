package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.mappers.permits.ConfinedSpaceMapper;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;

import static org.apache.poi.xwpf.usermodel.XWPFRun.FontCharRange.cs;

@Service
@Transactional
@RequiredArgsConstructor
public class NgConfinedSpaceService implements NgCrudService<ConfinedSpace, ConfinedSpaceDto, ConfinedSpaceRepo, ConfinedSpaceMapper> {
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final PermitModificationTracker modificationTracker;

    @Override
    public ConfinedSpaceRepo getRepo() {
        return confinedSpaceRepo;
    }

    @Override
    public ConfinedSpaceMapper getMapper() {
        return confinedSpaceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ConfinedSpaceDto getDto() {
        return new ConfinedSpaceDto();
    }

    @Override
    public ConfinedSpace getEntity() {
        return new ConfinedSpace();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<ConfinedSpace> getEntityClass() {
        return ConfinedSpace.class;
    }

    @Override
    public ConfinedSpace save(ConfinedSpaceDto dto) {
        ConfinedSpace oldEntity = dto.getId() != null ? confinedSpaceRepo.findById(dto.getId()).orElse(null) : null;
        ConfinedSpace cs = confinedSpaceMapper.convertToEntity(dto);
        ConfinedSpace saved = confinedSpaceRepo.save(cs);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("ConfinedSpace", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public ConfinedSpaceDto createConfinedSpaceRequest(ConfinedSpaceDto confinedSpaceDto) {
        ConfinedSpace confinedSpace = confinedSpaceMapper.convertToEntity(confinedSpaceDto);
        ConfinedSpace saved = confinedSpaceRepo.save(confinedSpace);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = confinedSpaceRepo.save(saved);
        }
        return confinedSpaceMapper.convertToDto(saved);
    }

    public ConfinedSpaceDto updateConfinedSpaceRequest(String id, ConfinedSpaceDto confinedSpaceDto) {
        ConfinedSpace confinedSpace1 = confinedSpaceMapper.convertToEntity(confinedSpaceDto);
        confinedSpace1.setId(Long.parseLong(id));
        return confinedSpaceMapper.convertToDto(save(confinedSpace1));
    }

    @Override
    public List<ConfinedSpaceDto> getAllDtos() {
        return getAll().stream().map(confinedSpaceMapper::convertToDto).toList();
    }

    public List<ConfinedSpaceDto> saveAll(List<ConfinedSpaceDto> permits) {
        return permits.stream().map(confinedSpaceMapper::convertToEntity).map(confinedSpaceRepo::save).map(confinedSpaceMapper::convertToDto).toList();
    }
}
