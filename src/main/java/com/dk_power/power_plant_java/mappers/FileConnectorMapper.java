package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.files.FileConnectorDto;
import com.dk_power.power_plant_java.dto.files.FileConnectorIdDto;
import com.dk_power.power_plant_java.entities.files.FileConnector;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.file.FileConnectorRepo;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * FileConnector ↔ DTO mapper. Mirrors {@link FileMapper}'s "load existing,
 * patch present fields" style for the id-dto path so partial-update callers
 * don't accidentally null out unchanged fields.
 */
@Component
public class FileConnectorMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final FileService fileService;
    private final FileConnectorRepo connectorRepo;

    public FileConnectorMapper(ModelMapper modelMapper,
                               @Lazy FileService fileService,
                               FileConnectorRepo connectorRepo) {
        this.modelMapper = modelMapper;
        this.fileService = fileService;
        this.connectorRepo = connectorRepo;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    /**
     * Entity → response DTO. Resolves file numbers/names eagerly so the viewer
     * can render the connector label without a follow-up fetch per connector.
     */
    public FileConnectorDto convertToDto(FileConnector entity) {
        if (entity == null) return null;
        FileConnectorDto dto = new FileConnectorDto();
        dto.setId(entity.getId());
        dto.setDeleted(entity.getDeleted());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setDateCreated(entity.getDateCreated());
        dto.setDateModified(entity.getDateModified());

        FileObject src = entity.getSourceFile();
        if (src != null) {
            dto.setSourceFileId(src.getId());
            dto.setSourceFileNumber(src.getFileNumber());
        }
        FileObject tgt = entity.getTargetFile();
        if (tgt != null) {
            dto.setTargetFileId(tgt.getId());
            dto.setTargetFileNumber(tgt.getFileNumber());
            dto.setTargetFileName(tgt.getName());
        }

        dto.setCoordinates(entity.getCoordinates());
        dto.setOriginalPictureSize(entity.getOriginalPictureSize());
        dto.setRotation(entity.getRotation());
        dto.setSymbolId(entity.getSymbolId());
        dto.setSvgPath(entity.getSvgPath());
        dto.setCounterpartConnectorId(entity.getCounterpartConnectorId());
        dto.setLabel(entity.getLabel());
        return dto;
    }

    /**
     * Create/update path. Loads the existing entity (or a fresh one) and only
     * overwrites fields the DTO actually provides — preserves anything the
     * caller didn't include, same null-vs-missing contract as FileMapper.
     */
    public FileConnector convertIdDtoToEntity(FileConnectorIdDto dto) {
        if (dto == null) return null;
        FileConnector entity;
        if (dto.getId() == null || dto.getId() == 0) {
            entity = new FileConnector();
        } else {
            entity = connectorRepo.findById(dto.getId()).orElse(new FileConnector());
        }

        if (dto.getId() != null && dto.getId() != 0) entity.setId(dto.getId());
        if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getNote() != null) entity.setNote(dto.getNote());
        if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

        // FKs: only overwrite when caller provided an id > 0. Same convention as
        // FileMapper (frontend can send 0 to mean "unset" or omit entirely).
        if (dto.getSourceFileId() != null && dto.getSourceFileId() > 0) {
            entity.setSourceFile(fileService.findById(dto.getSourceFileId()).orElse(null));
        }
        if (dto.getTargetFileId() != null && dto.getTargetFileId() > 0) {
            entity.setTargetFile(fileService.findById(dto.getTargetFileId()).orElse(null));
        }

        if (dto.getCoordinates() != null) entity.setCoordinates(dto.getCoordinates());
        if (dto.getOriginalPictureSize() != null) entity.setOriginalPictureSize(dto.getOriginalPictureSize());
        if (dto.getRotation() != null) entity.setRotation(dto.getRotation());
        if (dto.getSymbolId() != null) entity.setSymbolId(dto.getSymbolId());
        if (dto.getSvgPath() != null) entity.setSvgPath(dto.getSvgPath());
        if (dto.getLabel() != null) entity.setLabel(dto.getLabel());

        // counterpartConnectorId: intentionally NOT patched here. Use the
        // link/unlink endpoints — they enforce the bidirectional invariants
        // (atomic save, no self-link, opposite side cleared). Direct DTO
        // round-trip would silently break those guarantees.

        return entity;
    }
}
