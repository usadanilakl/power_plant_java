package com.dk_power.power_plant_java.dto.base_dtos;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class BaseDto {
    private Long id;
    private Long version;
    private Boolean deleted = false;
    private Boolean isVerified = false;
    private String name;
    private String note;
    private String createdBy;
    private String objectType;
    private UUID dataServiceItemId;
    private String refactorNotes;
    private LocalDateTime dateCreated;
    private LocalDateTime dateModified;
}
