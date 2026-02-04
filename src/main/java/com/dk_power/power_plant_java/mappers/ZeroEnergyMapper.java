
package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyIdDto;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgZeroEnergyService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ZeroEnergyMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final NgZeroEnergyService zeroEnergyService;
    private final LotoPointService lotoPointService;
    private final NgEquipmentService equipmentService;
    private final EquipmentMapper equipmentMapper;

    public ZeroEnergyMapper(ModelMapper modelMapper,
                            ValueService valueService,
                            @Lazy NgZeroEnergyService zeroEnergyService,
                            @Lazy LotoPointService lotoPointService,
                            @Lazy NgEquipmentService equipmentService,
                            @Lazy EquipmentMapper equipmentMapper) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.zeroEnergyService = zeroEnergyService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
        this.equipmentMapper = equipmentMapper;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyDto with full object references.
     */
    public ZeroEnergyDto convertToDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyDto dto = new ZeroEnergyDto();

        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplate(valueService.convertToDto(entity.getZeroEnergyTemplate()));
        }

        // Set template equipment IDs
        if (entity.getTemplateEquipmentIds() != null && !entity.getTemplateEquipmentIds().isEmpty()) {
            List<Long> list = entity.getTemplateEquipmentIds().stream().filter(e -> e != 0).toList();
            if(!list.isEmpty()){
                dto.setTemplateEquipmentIds(new ArrayList<>(list));

                // Load equipment by IDs
                List<EquipmentDto> equipmentDtos = new ArrayList<>();
                for (Long equipmentId : entity.getTemplateEquipmentIds()) {
                    equipmentService.findById(equipmentId).ifPresent(equipment -> {
                        equipmentDtos.add(equipmentMapper.convertToDtoLight(equipment));
                    });
                }

                dto.setTemplateEquipment(equipmentDtos);
            }
        }

        // Use the persisted method field directly (already resolved and stored in DB)
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Converts ZeroEnergy entity to ZeroEnergyIdDto with ID references only.
     */
    public ZeroEnergyIdDto convertToIdDto(ZeroEnergy entity) {
        if (entity == null) {
            return null;
        }

        ZeroEnergyIdDto dto = new ZeroEnergyIdDto();
        
        // Base fields
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getName() != null) dto.setName(entity.getName());
        if (entity.getNote() != null) dto.setNote(entity.getNote());
        if (entity.getDeleted() != null) dto.setDeleted(entity.getDeleted());
        if (entity.getCreatedBy() != null) dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getObjectType() != null) dto.setObjectType(entity.getObjectType());
        if (entity.getDataServiceItemId() != null) dto.setDataServiceItemId(entity.getDataServiceItemId());
        if (entity.getRefactorNotes() != null) dto.setRefactorNotes(entity.getRefactorNotes());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified());

        // ZeroEnergy specific fields - IDs only
        if (entity.getZeroEnergyTemplate() != null) {
            dto.setZeroEnergyTemplateId(entity.getZeroEnergyTemplate().getId());
        }

        // Set template equipment IDs
        if (entity.getTemplateEquipmentIds() != null && !entity.getTemplateEquipmentIds().isEmpty()) {
            dto.setTemplateEquipmentIds(new ArrayList<>(entity.getTemplateEquipmentIds()));
        }

        // Use the persisted method field directly (already resolved and stored in DB)
        if (entity.getMethod() != null) {
            dto.setMethod(entity.getMethod());
        }

        return dto;
    }

    /**
     * Builds the resolved zero energy method by substituting equipment tag numbers into placeholders.
     * Parses the JSON phrase from the template's alias field and replaces [tag1], [tag2], etc.
     * with actual equipment tag numbers.
     *
     * @param entity The ZeroEnergy entity
     * @return Resolved method string with equipment tag numbers substituted
     */
    private String buildResolvedMethod(ZeroEnergy entity) {
        if (entity == null || entity.getZeroEnergyTemplate() == null ||
            entity.getZeroEnergyTemplate().getAlias() == null) {
            return null;
        }

        try {
            String phraseJson = entity.getZeroEnergyTemplate().getAlias();

            // Parse JSON to extract segments
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(phraseJson);

            if (!root.has("segments")) {
                // No segments, return rawText if available
                if (root.has("rawText")) {
                    return root.get("rawText").asText();
                }
                return null;
            }

            // Get equipment IDs and load equipment entities
            java.util.List<Long> equipmentIds = new ArrayList<>();
            if (entity.getTemplateEquipmentIds() != null && !entity.getTemplateEquipmentIds().isEmpty()) {
                equipmentIds = new ArrayList<>(entity.getTemplateEquipmentIds());
            }

            // Load equipment entities to get tag numbers
            java.util.Map<Integer, String> placeholderToTagNumber = new java.util.HashMap<>();
            for (int i = 0; i < equipmentIds.size(); i++) {
                Long equipmentId = equipmentIds.get(i);
                final int index = i; // For lambda
                equipmentService.findById(equipmentId).ifPresent(equipment -> {
                    String tagNumber = equipment.getTagNumber();
                    if (tagNumber != null && !tagNumber.isEmpty()) {
                        placeholderToTagNumber.put(index, tagNumber);
                    }
                });
            }

            // Build the resolved string from segments
            StringBuilder result = new StringBuilder();
            com.fasterxml.jackson.databind.JsonNode segments = root.get("segments");

            if (segments.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode segment : segments) {
                    String type = segment.has("type") ? segment.get("type").asText() : "text";

                    if ("text".equals(type)) {
                        String content = segment.has("content") ? segment.get("content").asText() : "";
                        result.append(content);
                    } else if ("placeholder".equals(type)) {
                        int placeholderIndex = segment.has("placeholderIndex") ? segment.get("placeholderIndex").asInt() : -1;

                        // Substitute with actual equipment tag number
                        if (placeholderIndex >= 0 && placeholderToTagNumber.containsKey(placeholderIndex)) {
                            result.append(placeholderToTagNumber.get(placeholderIndex));
                        } else {
                            // Fallback: use the placeholder content (e.g., "tag1")
                            String content = segment.has("content") ? segment.get("content").asText() : "?";
                            result.append("[").append(content).append("]");
                        }
                    }
                }
            }

            return result.toString();
        } catch (Exception e) {
            // If parsing fails, return null or basic method
            if (entity.getMethod() != null) {
                return entity.getMethod();
            }
            return null;
        }
    }

    /**
     * Converts ZeroEnergyDto to ZeroEnergy entity.
     *
     * IMPORTANT: This method is for direct entity creation/update only.
     * When saving a LotoPoint with ZeroEnergy, use ZeroEnergyService.findOrCreate()
     * instead to enable automatic deduplication.
     */
    public ZeroEnergy convertToEntity(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.getEntityById(dto.getId());
        }

        // Base fields
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplate() != null) {
            entity.setZeroEnergyTemplate(valueService.convertToEntity(dto.getZeroEnergyTemplate()));
        }

        // Set template equipment IDs with normalization (sorted, no duplicates)
        if (dto.getTemplateEquipmentIds() != null && !dto.getTemplateEquipmentIds().isEmpty()) {
            entity.setNormalizedEquipmentIds(dto.getTemplateEquipmentIds());
        }

        // Build and persist the resolved method
        String resolvedMethod = buildResolvedMethod(entity);
        if (resolvedMethod != null) {
            entity.setMethod(resolvedMethod);
        }

        return entity;
    }

    /**
     * Converts ZeroEnergyDto to ZeroEnergy using find-or-create pattern.
     * This is the recommended method for saving LotoPoints with ZeroEnergy.
     *
     * It will:
     * 1. Search for existing ZeroEnergy with same template + equipment IDs
     * 2. Reuse if found
     * 3. Create new if not found
     *
     * This enables automatic deduplication.
     */
    public ZeroEnergy convertToEntityWithDeduplication(ZeroEnergyDto dto) {
        if (dto == null) {
            return null;
        }

        // Use the service's findOrCreate method
        return zeroEnergyService.findOrCreate(dto);
    }

    /**
     * Converts ZeroEnergyIdDto to ZeroEnergy entity.
     * Uses ID references to load related entities.
     */
    public ZeroEnergy convertIdDtoToEntity(ZeroEnergyIdDto dto) {
        if (dto == null) {
            return null;
        }

        ZeroEnergy entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new ZeroEnergy();
        } else {
            entity = zeroEnergyService.findById(dto.getId()).orElse(new ZeroEnergy());
        }

        // Base fields
        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // ZeroEnergy specific fields
        if (dto.getZeroEnergyTemplateId() != null) {
            entity.setZeroEnergyTemplate(valueService.findById(dto.getZeroEnergyTemplateId()).orElse(null));
        }

        // Set template equipment IDs
        if (dto.getTemplateEquipmentIds() != null && !dto.getTemplateEquipmentIds().isEmpty()) {
            entity.setTemplateEquipmentIdsList(dto.getTemplateEquipmentIds());
        }

        // Build and persist the resolved method
        String resolvedMethod = buildResolvedMethod(entity);
        if (resolvedMethod != null) {
            entity.setMethod(resolvedMethod);
        }

        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
