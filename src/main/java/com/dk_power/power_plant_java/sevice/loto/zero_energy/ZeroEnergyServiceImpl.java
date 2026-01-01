package com.dk_power.power_plant_java.sevice.loto.zero_energy;

import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.ZeroEnergyMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.ZeroEnergyRepo;
import org.hibernate.SessionFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ZeroEnergyServiceImpl implements ZeroEnergyService {

    private final ZeroEnergyRepo zeroEnergyRepo;
    private final LotoPointRepo lotoPointRepo;
    private final ZeroEnergyMapper zeroEnergyMapper;
    private final SessionFactory sessionFactory;

    public ZeroEnergyServiceImpl(
            ZeroEnergyRepo zeroEnergyRepo,
            LotoPointRepo lotoPointRepo,
            @Lazy ZeroEnergyMapper zeroEnergyMapper,
            SessionFactory sessionFactory) {
        this.zeroEnergyRepo = zeroEnergyRepo;
        this.lotoPointRepo = lotoPointRepo;
        this.zeroEnergyMapper = zeroEnergyMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public ZeroEnergy getEntity() {
        return new ZeroEnergy();
    }

    @Override
    public ZeroEnergyDto getDto() {
        return new ZeroEnergyDto();
    }

    @Override
    public ZeroEnergyRepo getRepo() {
        return zeroEnergyRepo;
    }

    @Override
    public ZeroEnergyMapper getMapper() {
        return zeroEnergyMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ZeroEnergy convertToEntity(ZeroEnergyDto dto) {
        return zeroEnergyMapper.convertToEntity(dto);
    }

    @Override
    public ZeroEnergyDto convertToDto(ZeroEnergy entity) {
        return zeroEnergyMapper.convertToDto(entity);
    }

    /**
     * Core deduplication logic: Find existing or create new ZeroEnergy.
     * <p>
     * Algorithm:
     * 1. Normalize the template ID and equipment IDs
     * 2. Search for existing ZeroEnergy with same template and equipment
     * 3. If found, return it (reuse)
     * 4. If not found, create and save new one
     */
    @Override
    public ZeroEnergy findOrCreate(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        // Extract and normalize the key fields
        Long templateId = (dto.getZeroEnergyTemplate() != null)
                ? dto.getZeroEnergyTemplate().getId()
                : null;

        Set<Long> equipmentIds = normalizeEquipmentIds(dto.getTemplateEquipmentIds());

        // Try to find existing
        Optional<ZeroEnergy> existing = zeroEnergyRepo.findByTemplateAndEquipmentIds(
                templateId,
                sortAndJoinIds(equipmentIds)
        );

        if (existing.isPresent()) {
            // Reuse existing ZeroEnergy
            return existing.get();
        }

        // Create new ZeroEnergy
        ZeroEnergy newZeroEnergy = zeroEnergyMapper.convertToEntity(dto);
        return zeroEnergyRepo.save(newZeroEnergy);
    }

    @Override
    public List<ZeroEnergyDto> getAllWithUsageCount() {
        List<ZeroEnergy> allZeroEnergies = zeroEnergyRepo.findAll();

        return allZeroEnergies.stream()
                .map(ze -> {
                    ZeroEnergyDto dto = zeroEnergyMapper.convertToDto(ze);
                    // You could add a usage count field to the DTO if needed
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ZeroEnergy> findOrphans() {
        return zeroEnergyRepo.findOrphans();
    }

    @Override
    public int cleanupOrphans() {
        return zeroEnergyRepo.deleteOrphans();
    }

    @Override
    public int merge(Long sourceId, Long targetId) {
        if (sourceId == null || targetId == null || sourceId.equals(targetId)) {
            return 0;
        }

        // Find both entities
        Optional<ZeroEnergy> sourceOpt = zeroEnergyRepo.findById(sourceId);
        Optional<ZeroEnergy> targetOpt = zeroEnergyRepo.findById(targetId);

        if (sourceOpt.isEmpty() || targetOpt.isEmpty()) {
            return 0;
        }

        ZeroEnergy target = targetOpt.get();

        // Reassign all LotoPoints from source to target
        int count = lotoPointRepo.reassignZeroEnergy(sourceId, targetId);

        // Delete the source
        zeroEnergyRepo.deleteById(sourceId);

        return count;
    }

    @Override
    public long getUsageCount(Long zeroEnergyId) {
        if (zeroEnergyId == null) {
            return 0;
        }
        return lotoPointRepo.countByZeroEnergyId(zeroEnergyId);
    }

    /**
     * Normalizes equipment IDs by removing nulls, zeros, and duplicates.
     */
    private Set<Long> normalizeEquipmentIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }

        return ids.stream()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .collect(Collectors.toSet());
    }

    /**
     * Sorts equipment IDs and joins them as comma-separated string for comparison.
     * This ensures that [1,2,3] and [3,2,1] are treated as the same.
     */
    private String sortAndJoinIds(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }

        return ids.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }
}
