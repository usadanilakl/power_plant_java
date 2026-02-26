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
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

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
        ConfinedSpace cs = confinedSpaceMapper.convertToEntity(dto);
        return confinedSpaceRepo.save(cs);
    }

    public ConfinedSpaceDto createConfinedSpaceRequest(ConfinedSpaceDto confinedSpaceDto) {
        ConfinedSpace confinedSpace = confinedSpaceMapper.convertToEntity(confinedSpaceDto);
        return confinedSpaceMapper.convertToDto(confinedSpaceRepo.save(confinedSpace));
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
