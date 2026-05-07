package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.dto.permits.LotoSnapshotDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
@RequiredArgsConstructor
public class LotoSnapshotMapper {
    private final LotoRepo lotoRepo;
    private final LotoSnapshotRepo lotoSnapshotRepo;
    public LotoSnapshotDto convertToDto(LotoSnapshot snapshot) {
        if (snapshot == null) {
            return null;
        }

        LotoSnapshotDto dto = new LotoSnapshotDto();

        // Set fields from BaseDto
        dto.setId(snapshot.getId());
        dto.setDeleted(snapshot.getDeleted());
        dto.setName(snapshot.getName());
        dto.setNote(snapshot.getNote());
        dto.setCreatedBy(snapshot.getCreatedBy());
        dto.setObjectType(snapshot.getObjectType());
        dto.setDataServiceItemId(snapshot.getDataServiceItemId());
        dto.setRefactorNotes(snapshot.getRefactorNotes());
        dto.setDateCreated(snapshot.getDateCreated());
        dto.setDateModified(snapshot.getDateModified());

        // Set LotoSnapshotDto specific fields
        dto.setLotoId(snapshot.getLoto().getId());
        dto.setBoxNumber(snapshot.getBoxNumber());
        dto.setLocks(snapshot.getLocks());
        dto.setRequestorName(snapshot.getRequestorName());
        dto.setWorkAuthority(snapshot.getWorkAuthority());
        dto.setRequestTime(snapshot.getRequestTime());
        dto.setWorkAuthorityTime(snapshot.getWorkAuthorityTime());
        dto.setStatus(snapshot.getStatus());
        dto.setLotoPointsData(new HashSet<>(snapshot.getLotoPointDtos())); // This uses the getLotoPointDtos() method from LotoSnapshot
        dto.setWorkScope(snapshot.getWorkScope());
        dto.setSnapshotReason(snapshot.getSnapshotReason());

        // Lifecycle event fields
        dto.setHungBy(snapshot.getHungBy());                         dto.setHungAt(snapshot.getHungAt());
        dto.setVerifiedBy(snapshot.getVerifiedBy());                 dto.setVerifiedAt(snapshot.getVerifiedAt());
        dto.setActivatedBy(snapshot.getActivatedBy());               dto.setActivatedAt(snapshot.getActivatedAt());
        dto.setTestStartedBy(snapshot.getTestStartedBy());           dto.setTestStartedAt(snapshot.getTestStartedAt());
        dto.setReactivatedBy(snapshot.getReactivatedBy());           dto.setReactivatedAt(snapshot.getReactivatedAt());
        dto.setTransferredFrom(snapshot.getTransferredFrom());
        dto.setTransferredTo(snapshot.getTransferredTo());
        dto.setTransferredAt(snapshot.getTransferredAt());
        dto.setAcceptedBy(snapshot.getAcceptedBy());                 dto.setAcceptedAt(snapshot.getAcceptedAt());
        dto.setRequestorReleasedBy(snapshot.getRequestorReleasedBy());
        dto.setRequestorReleasedAt(snapshot.getRequestorReleasedAt());
        dto.setControlAuthorityReleasedBy(snapshot.getControlAuthorityReleasedBy());
        dto.setControlAuthorityReleasedAt(snapshot.getControlAuthorityReleasedAt());
        dto.setLocksRemovedBy(snapshot.getLocksRemovedBy());         dto.setLocksRemovedAt(snapshot.getLocksRemovedAt());
        dto.setClosedBy(snapshot.getClosedBy());                     dto.setClosedAt(snapshot.getClosedAt());

        return dto;
    }
    
public LotoSnapshot convertToEntity(LotoSnapshotDto dto) {
    if (dto == null) {
        return null;
    }

    LotoSnapshot snapshot = new LotoSnapshot();
    if(dto.getId()!=null) snapshot = lotoSnapshotRepo.findById(dto.getId()).orElse(new LotoSnapshot());

    // Set fields from BaseDto
    if (dto.getId() != null) snapshot.setId(dto.getId());
    if (dto.getDeleted() != null) snapshot.setDeleted(dto.getDeleted());
    if (dto.getName() != null) snapshot.setName(dto.getName());
    if (dto.getNote() != null) snapshot.setNote(dto.getNote());
    if (dto.getCreatedBy() != null) snapshot.setCreatedBy(dto.getCreatedBy());
    if (dto.getObjectType() != null) snapshot.setObjectType(dto.getObjectType());
    if (dto.getDataServiceItemId() != null) snapshot.setDataServiceItemId(dto.getDataServiceItemId());
    if (dto.getRefactorNotes() != null) snapshot.setRefactorNotes(dto.getRefactorNotes());
    if (dto.getDateCreated() != null) snapshot.setDateCreated(dto.getDateCreated());
    if (dto.getDateModified() != null) snapshot.setDateModified(dto.getDateModified());

    // Set LotoSnapshot specific fields
    if (dto.getBoxNumber() != null) snapshot.setBoxNumber(dto.getBoxNumber());
    if (dto.getLocks() != null) snapshot.setLocks(dto.getLocks());
    if (dto.getRequestorName() != null) snapshot.setRequestorName(dto.getRequestorName());
    if (dto.getWorkAuthority() != null) snapshot.setWorkAuthority(dto.getWorkAuthority());
    if (dto.getRequestTime() != null) snapshot.setRequestTime(dto.getRequestTime());
    if (dto.getWorkAuthorityTime() != null) snapshot.setWorkAuthorityTime(dto.getWorkAuthorityTime());
    if (dto.getStatus() != null) snapshot.setStatus(dto.getStatus());
    if (dto.getWorkScope() != null) snapshot.setWorkScope(dto.getWorkScope());

    // Handle Loto relationship
    if (dto.getLotoId() != null) {
        snapshot.setLoto(lotoRepo.findById(dto.getLotoId()).orElse(null));
    }

    // Handle LotoPointsData
    if (dto.getLotoPointsData() != null && !dto.getLotoPointsData().isEmpty()) {
        snapshot.setLotoPointDtos(dto.getLotoPointsData());
    }

    return snapshot;
}
    
}
