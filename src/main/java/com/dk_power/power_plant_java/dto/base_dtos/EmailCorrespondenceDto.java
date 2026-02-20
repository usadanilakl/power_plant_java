package com.dk_power.power_plant_java.dto.base_dtos;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO for EmailCorrespondence entity.
 * Used for transferring email correspondence data between layers.
 */
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class EmailCorrespondenceDto extends BaseDto {

    private Long entityId;
    private String entityType;
    private ValueDto correspondenceType;
    private String direction;  // "OUTBOUND" or "INBOUND"
    private String subject;
    private String bodyContent;
    private String sender;
    private String recipient;
    private LocalDateTime sentDateTime;
    private String internetMessageId;
    private String conversationId;
    private String graphMessageId;
    private String linkedSharepointId;
    private Boolean isRead = false;
    private Boolean needsAttention = false;
}
