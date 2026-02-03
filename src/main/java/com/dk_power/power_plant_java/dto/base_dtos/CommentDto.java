package com.dk_power.power_plant_java.dto.base_dtos;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class CommentDto extends BaseDto {
    private String content;
    private Long entityId;
    private String entityType;
    private ValueDto commentType;
    private Boolean needsAttention = false;
    private Boolean isResolved = false;
}
