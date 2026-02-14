package com.dk_power.power_plant_java.entities.base_entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.Hibernate;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Objects;

@MappedSuperclass
@Getter
@Setter
//@EntityListeners(AuditingEntityListener.class)
@Audited
@Where(clause = "deleted=false")
public class BaseAuditEntity extends BaseIdEntity {
//    @CreatedDate
//    @Temporal(TemporalType.TIMESTAMP)
//    @Column(updatable = false)
//    private LocalDateTime dateCreated;
//    @LastModifiedDate
//    @Temporal(TemporalType.TIMESTAMP)
//    private LocalDateTime dateModified;
    @CreatedBy
    private String createdBy;
    @LastModifiedBy
    //@Column(nullable = false)
    private String modifiedBy;



//    @PrePersist
//    protected void onCreate() {
//        dateCreated = LocalDateTime.now();
//        dateModified = LocalDateTime.now();
//    }
//
//    @PreUpdate
//    protected void onUpdate() {
//        System.out.println("updating...");
//        this.setDateModified(LocalDateTime.now());
//    }

@Override
public boolean equals(Object obj) {
    if (this == obj) {
        return true;
    }
    if (obj == null || Hibernate.getClass(this) != Hibernate.getClass(obj)) {
        return false;
    }
    BaseAuditEntity otherEntity = (BaseAuditEntity) obj;
    return Objects.equals(getId(), otherEntity.getId());
}

@Override
public int hashCode() {
    return getId() != null ? getId().hashCode() : System.identityHashCode(this);
}
}
