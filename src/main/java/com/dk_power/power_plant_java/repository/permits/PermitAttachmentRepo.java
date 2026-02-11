package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitAttachmentRepo extends JpaRepository<PermitAttachment, Long> {
    List<PermitAttachment> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
