package com.dk_power.power_plant_java.entities.base_entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
//@FilterDef(name = "deletedFilter", parameters = @ParamDef(name = "isDeleted", type = Boolean.class))
//@Filter(name = "deletedFilter", condition = "deleted = :isDeleted")
@NoArgsConstructor
public class BaseIdEntity {

    @Id
    @GeneratedValue(generator = "device-prefixed")
    @GenericGenerator(name = "device-prefixed", strategy = "com.dk_power.power_plant_java.config.DevicePrefixedIdGenerator")
    @Where(clause = "deleted = false")
    private Long id;
    private Boolean deleted = false;
    private Boolean isVerified = false;
    private String name;
    private String note;
    private String createdBy;
//    @Enumerated(EnumType.STRING)
//    private ObjectType objectType;
    private String objectType;
    private UUID dataServiceItemId;
    @Column(columnDefinition = "TEXT")
    private String refactorNotes;
    @Temporal(TemporalType.TIMESTAMP)
    @Column(updatable = false)
    private LocalDateTime dateCreated;
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime dateModified;
    {
        objectType = this.getClass().getSimpleName();
    }

    @PrePersist
    protected void onCreate() {
        dateCreated = LocalDateTime.now();
        dateModified = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
//        System.out.println("updating...");
        this.setDateModified(LocalDateTime.now());
    }

    public void addRefactorNote(String s) {
        if(refactorNotes == null || refactorNotes.isEmpty()) refactorNotes = s;
        else refactorNotes += ";" + s;
    }
}
