package com.dk_power.power_plant_java.dto.pa;

import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
public class PaRequestDto {
    private String actionType;
    /**
     * Optional sub-entity discriminator for flows that serve more than one
     * SharePoint list (e.g. Inventory: "item" vs "usage"). Null for single-list flows.
     */
    private String entity;
    private String id;
    private Map<String, Object> data = Collections.emptyMap();
    private List<PaAttachmentDto> attachments = Collections.emptyList();
}
