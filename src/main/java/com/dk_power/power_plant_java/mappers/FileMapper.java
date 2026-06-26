package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class FileMapper implements BaseMapper {
    private final UniversalMapper mapper;
    private final EquipmentMapper equipmentMapper;
    private final EquipmentService equipmentService;
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;
    private final HeatTraceService heatTraceService;
    private final HighlightMapper highlightMapper;

    public FileMapper(UniversalMapper mapper, @Lazy EquipmentMapper equipmentMapper, @Lazy EquipmentService equipmentService, ModelMapper modelMapper, ValueService valueService, @Lazy FileService fileService, @Lazy HeatTraceService heatTraceService, @Lazy HighlightMapper highlightMapper) {
        this.mapper = mapper;
        this.equipmentMapper = equipmentMapper;
        this.equipmentService = equipmentService;
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.fileService = fileService;
        this.heatTraceService = heatTraceService;
        this.highlightMapper = highlightMapper;
    }


    public FileDto convertToDto(FileObject file) {
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.getFileLink());
        fileDto.setFileNumber(convertFileNumberStringToArray(file.getFileNumber()));
        fileDto.setFolder(file.getFolder());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setExtension(file.getExtension());
        fileDto.setIsVerified(file.getIsVerified());
        if (file.getName() != null) fileDto.setName(file.getName());
        if (file.getObjectType() != null) fileDto.setObjectType(file.getObjectType());
        fileDto.setId(file.getId());
        if (file.getFileType() != null) fileDto.setFileType(valueService.convertToDto(file.getFileType()));
        if (file.getSystem() != null) fileDto.setSystem(valueService.convertToDto(file.getSystem()));
        if (file.getVendor() != null && file.getVendor().getId()!=null) fileDto.setVendor(valueService.convertToDto(file.getVendor()));
        if (file.getRelatedSystems() != null) fileDto.setRelatedSystemsAsString(file.getRelatedSystems());
        // New @ManyToMany collections — same lazy hazard as convertToDtoLight. Some
        // callers (e.g. /ng/files/paginated → controller-level .map(toDto)) map
        // entities outside the query transaction. Guard with Hibernate.isInitialized
        // so we don't trigger LazyInitializationException for projection-fetched
        // entities, and leave the DTO field empty (not "loaded and empty") with a
        // debug log so the caller path is visible.
        if (file.getSystems() != null && org.hibernate.Hibernate.isInitialized(file.getSystems())) {
            if (!file.getSystems().isEmpty()) {
                fileDto.setSystems(file.getSystems().stream().map(valueService::convertToDto).toList());
            }
        } else if (file.getSystems() != null) {
            org.slf4j.LoggerFactory.getLogger(FileMapper.class)
                    .debug("convertToDto: systems not initialized for FileObject #{}, returning empty (caller should map within tx)", file.getId());
        }
        if (file.getTags() != null && org.hibernate.Hibernate.isInitialized(file.getTags())) {
            if (!file.getTags().isEmpty()) {
                fileDto.setTags(file.getTags().stream().map(valueService::convertToDto).toList());
            }
        } else if (file.getTags() != null) {
            org.slf4j.LoggerFactory.getLogger(FileMapper.class)
                    .debug("convertToDto: tags not initialized for FileObject #{}, returning empty (caller should map within tx)", file.getId());
        }
        if (file.getPoints() != null)
            fileDto.setPoints(file.getPoints().stream().map(equipmentMapper::convertToDto).toList());
//        if(file.getHeatTrace()!=null) fileDto.setHeatTraceList(file.getHeatTrace().stream().map(heatTraceService::convertToDto).toList());
        if (file.getBulkEditStep() != null) fileDto.setBulkEditStep(file.getBulkEditStep());
//        if (file.getHighlights() != null)
//            fileDto.setHighlights(file.getHighlights().stream().map(highlightMapper::convertToDtoLight).toList());
        if (file.getDocNum() != null) fileDto.setDocNum(file.getDocNum());
        if (file.getIsVerified() != null) fileDto.setIsVerified(file.getIsVerified());
        if(file.getExtensions()!=null && !file.getExtensions().isEmpty()) fileDto.setExtensions(file.getExtensionsArray());
        return fileDto;
    }

    public FileDto convertToDtoLight(FileObject file) {
        FileDto fileDto = new FileDto();
        fileDto.setFileLink(file.buildFileLink());
        fileDto.setFileNumber(convertFileNumberStringToArray(file.getFileNumber()));
        fileDto.setFolder(file.getFolder());
        fileDto.setBaseLink(file.getBaseLink());
        fileDto.setExtension(file.getExtension());
        if (file.getIsVerified()!= null) fileDto.setIsVerified(file.getIsVerified());
        if (file.getName() != null) fileDto.setName(file.getName());
        if (file.getObjectType() != null) fileDto.setObjectType(file.getObjectType());
        fileDto.setId(file.getId());
        if (file.getFileType() != null) fileDto.setFileType(valueService.convertToDto(file.getFileType()));
        if (file.getSystem() != null) fileDto.setSystem(valueService.convertToDto(file.getSystem()));
        if (file.getVendor() != null) fileDto.setVendor(valueService.convertToDto(file.getVendor()));
        if (file.getRelatedSystems() != null) fileDto.setRelatedSystemsAsString(file.getRelatedSystems());
        // systems/tags are @ManyToMany LAZY collections. The search-table path force-
        // initializes them inside NgFileService.searchAsLightDto, so they're populated
        // here. Other callers of convertToDtoLight (e.g. HeatTraceMapper) may pass
        // detached entities — we check Hibernate.isInitialized rather than catching
        // LazyInitializationException so an empty DTO field never masquerades as
        // "loaded and empty" silently; if it's not initialized, log a debug line
        // so the caller path can be made transactional. See review note about HeatTraceMapper.
        if (file.getSystems() != null && org.hibernate.Hibernate.isInitialized(file.getSystems())) {
            if (!file.getSystems().isEmpty()) {
                fileDto.setSystems(file.getSystems().stream().map(valueService::convertToDto).toList());
            }
        } else if (file.getSystems() != null) {
            org.slf4j.LoggerFactory.getLogger(FileMapper.class)
                    .debug("convertToDtoLight: systems not initialized for FileObject #{}, returning empty (caller should map within tx)", file.getId());
        }
        if (file.getTags() != null && org.hibernate.Hibernate.isInitialized(file.getTags())) {
            if (!file.getTags().isEmpty()) {
                fileDto.setTags(file.getTags().stream().map(valueService::convertToDto).toList());
            }
        } else if (file.getTags() != null) {
            org.slf4j.LoggerFactory.getLogger(FileMapper.class)
                    .debug("convertToDtoLight: tags not initialized for FileObject #{}, returning empty (caller should map within tx)", file.getId());
        }
        if (file.getBulkEditStep() != null) fileDto.setBulkEditStep(file.getBulkEditStep());
//        if(file.getPoints()!=null) fileDto.setPoints(file.getPoints().stream().map(e->equipmentService.getDtoById(e.getId())).toList());
//        if(file.getHeatTrace()!=null) fileDto.setHeatTraceList(file.getHeatTrace().stream().map(heatTraceService::convertToDto).toList());
        // NOTE: highlights is a LAZY collection. The light DTO is mapped outside the
        // query's transaction (e.g. search → page.map(toDtoLight)), so touching it here
        // throws LazyInitializationException. Highlights aren't needed for list/table
        // rows anyway — the full convertToDto leaves it out too. Keep it out of light.
        if (file.getDocNum() != null) fileDto.setDocNum(file.getDocNum());
        if (file.getIsVerified() != null) fileDto.setIsVerified(file.getIsVerified());
        return fileDto;
    }

    public FileDto convertToDto(FileObject file, String extension) {
        FileDto fileDto = convertToDto(file);
        fileDto.setFileLink(file.buildFileLink(extension));
        return fileDto;
    }

    public FileObject convertToEntity(FileDto fileDto) {
        FileObject file = fileService.getEntityById(fileDto.getId());

        //if(!=null)
        if(file.getIsVerified()!=null) file.setIsVerified(fileDto.getIsVerified());
        if (fileDto.getFileNumber() != null && !fileDto.getFileNumber().isEmpty()) file.setFileNumber(convertFileNumberArrayToString(fileDto.getFileNumber()));
        if (fileDto.getFileLink() != null) file.setFileLink(fileDto.getFileLink());
        if (fileDto.getFolder() != null) file.setFolder(fileDto.getFolder());
        if (fileDto.getBaseLink() != null) file.setBaseLink(fileDto.getBaseLink());
        if (fileDto.getVendor() != null) file.setVendor(valueService.getEntityById(fileDto.getVendor().getId()));
        if (fileDto.getFileType() != null) file.setFileType(valueService.getEntityById(fileDto.getFileType().getId()));
        if (fileDto.getSystem() != null) file.setSystem(valueService.getEntityById(fileDto.getSystem().getId()));
        if (fileDto.getPoints() != null)
            file.setPoints(fileDto.getPoints().stream().map(e -> equipmentService.getEntityById(e.getId())).toList());
        if (fileDto.getExtension() != null) file.setExtension(fileDto.getExtension());
        if (fileDto.getRelatedSystems() != null && file.getRelatedSystems() != null && !fileDto.getRelatedSystems().equals(file.getRelatedSystems()))
            file.setRelatedSystems(fileDto.getRelatedSystemsAsString());
        if (fileDto.getName() != null) file.setName(fileDto.getName());
        if (fileDto.getBulkEditStep() != null) file.setBulkEditStep(fileDto.getBulkEditStep());
//        if(fileDto.getHeatTraceList()!=null) file.setHeatTrace(fileDto.getHeatTraceList().stream().map(heatTraceService::convertToEntity).toList());
        if (fileDto.getHighlights() != null)
            file.setHighlights(fileDto.getHighlights().stream().map(highlightMapper::convertToEntity).toList());
        if (fileDto.getDocNum() != null) file.setDocNum(fileDto.getDocNum());
        if (fileDto.getIsVerified() != null) file.setIsVerified(fileDto.getIsVerified());
        if (fileDto.getExtensions() != null && !fileDto.getExtensions().isEmpty()) file.setExtensions(String.join(",", fileDto.getExtensions()));
        return file;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }


    public FileObject convertIdDtoToEntity(FileIdDto dto) {
        if (dto == null) return null;

        FileObject fileObject;
        if (dto.getId() == null || dto.getId() == 0) {
            fileObject = new FileObject();
        } else {
            fileObject = fileService.findById(dto.getId()).orElse(new FileObject());
        }

        // Set fields from BaseDto
        if(dto.getIsVerified()!= null) fileObject.setIsVerified(dto.getIsVerified());
        if (dto.getId() != null && dto.getId() != 0) fileObject.setId(dto.getId());
        if (dto.getDeleted() != null) fileObject.setDeleted(dto.getDeleted());
        if (dto.getName() != null) fileObject.setName(dto.getName());
        if (dto.getNote() != null) fileObject.setNote(dto.getNote());
        if (dto.getCreatedBy() != null) fileObject.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) fileObject.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) fileObject.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) fileObject.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) fileObject.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) fileObject.setDateModified(dto.getDateModified());

        // Set fields specific to FileIdDto.
        // Note: frontend defaults FK IDs to 0 when unset (see file-id.model.ts). Treat 0 as
        // "not provided" so existing FKs on the loaded entity aren't overwritten with null.
        if (dto.getFileType() != null && dto.getFileType() > 0) {
            fileObject.setFileType(valueService.findById(dto.getFileType()).orElse(null));
        }
        if (dto.getFileLink() != null) fileObject.setFileLink(dto.getFileLink());
        if (dto.getBaseLink() != null) fileObject.setBaseLink(dto.getBaseLink());
        if (dto.getFolder() != null) fileObject.setFolder(dto.getFolder());
        if (dto.getSystem() != null && dto.getSystem() > 0) {
            fileObject.setSystem(valueService.findById(dto.getSystem()).orElse(null));
        }
        if (dto.getRelatedSystems() != null) fileObject.setRelatedSystems(dto.getRelatedSystemsAsString());
        // New @ManyToMany collections (proper systems + tags). Caller posts IDs; we
        // resolve each to a Value entity and replace the existing set so the form is
        // the authoritative source on save. Mutating the same Set instance so
        // Hibernate sees the change (replacing the reference can detach the proxy).
        // Track whether either @ManyToMany collection was touched so we can bump
        // `dateModified` below. Hibernate does NOT dirty the parent row for join-
        // table-only mutations, so without an explicit scalar touch the parent's
        // UPDATE never fires, @PostUpdate doesn't run, and FieldChangeEntityListener
        // never broadcasts the systems/tags change to other clients (sync regression).
        boolean collectionTouched = false;
        if (dto.getSystems() != null) {
            var sysSet = fileObject.getSystems();
            if (sysSet == null) { sysSet = new java.util.HashSet<>(); fileObject.setSystems(sysSet); }
            sysSet.clear();
            for (Long valueId : dto.getSystems()) {
                if (valueId == null || valueId <= 0) continue;
                valueService.findById(valueId).ifPresent(sysSet::add);
            }
            // Keep the legacy primary `system` FK in sync with the new collection:
            // when the user empties the multi-select, the table column still
            // sorts/filters/groups by `system.name`, so leaving the old primary
            // there would surface a system the user just removed. The non-empty
            // case is already handled by the explicit `system` field set by the
            // form (mirrors the first selected system).
            if (sysSet.isEmpty()) {
                fileObject.setSystem(null);
            }
            collectionTouched = true;
        }
        if (dto.getTags() != null) {
            var tagSet = fileObject.getTags();
            if (tagSet == null) { tagSet = new java.util.HashSet<>(); fileObject.setTags(tagSet); }
            tagSet.clear();
            for (Long valueId : dto.getTags()) {
                if (valueId == null || valueId <= 0) continue;
                valueService.findById(valueId).ifPresent(tagSet::add);
            }
            collectionTouched = true;
        }
        if (collectionTouched) {
            // Force the parent row dirty so @PostUpdate fires → sync emission picks
            // up the new ManyToMany state. Without this, collection-only edits
            // (e.g. user changed only tags) never reach other clients.
            fileObject.setDateModified(java.time.LocalDateTime.now());
        }
        if (dto.getFileNumber() != null && !dto.getFileNumber().isEmpty()) fileObject.setFileNumber(convertFileNumberArrayToString(dto.getFileNumber()));
        if (dto.getVendor() != null && dto.getVendor() > 0) {
            fileObject.setVendor(valueService.findById(dto.getVendor()).orElse(null));
        }
        if (dto.getObjectType() != null) fileObject.setObjectType(dto.getObjectType());
        if (dto.getExtension() != null) fileObject.setExtension(dto.getExtension());
        if (dto.getBulkEditStep() != null) fileObject.setBulkEditStep(dto.getBulkEditStep());
        if (dto.getDocNum() != null) fileObject.setDocNum(dto.getDocNum());
        if (dto.getIsVerified() != null) fileObject.setIsVerified(dto.getIsVerified());
        if (dto.getExtensions() != null && !dto.getExtensions().isEmpty()) fileObject.setExtensions(String.join(",", dto.getExtensions()));
        // Handle points
        if (dto.getPoints() != null && !dto.getPoints().isEmpty()) {
            List<Equipment> points = dto.getPoints().stream()
                    .map(id -> equipmentService.findById(id).orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            fileObject.setPoints(points);
        }

        return fileObject;
    }

    public String convertFileNumberArrayToString(List<String> fileNumberArray) {
        if (fileNumberArray != null && !fileNumberArray.isEmpty()) {
            String joinedFileNumber = fileNumberArray.stream()
                    .map(part -> part.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\s+", "-"))
                    .collect(Collectors.joining("__SEP__"));

            // Optionally limit the length
            if (joinedFileNumber.length() > 255) {  // adjust max length as needed
                joinedFileNumber = joinedFileNumber.substring(0, 255);
            }
            return joinedFileNumber;
        }
        return null;
    }

    public List<String> convertFileNumberStringToArray(String fileNumberString) {
        return fileNumberString != null ? new ArrayList<>(Arrays.asList(fileNumberString.split("__SEP__"))) : new ArrayList<>();
    }

}
