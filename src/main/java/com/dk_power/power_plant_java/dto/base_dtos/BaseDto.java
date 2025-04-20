package com.dk_power.power_plant_java.dto.base_dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class BaseDto {
    private Long id;
    private Boolean deleted = false;
    private String name;
    private String note;
    private String createdBy;
    private String objectType;
    private UUID dataServiceItemId;
    private String refactorNotes;
    private LocalDateTime dateCreated;
    private LocalDateTime dateModified;
}