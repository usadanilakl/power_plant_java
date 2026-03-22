package com.dk_power.power_plant_java.entities.new_version;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
public class NewBaseEntity  {

    @Id
    @GeneratedValue(generator = "device-prefixed")
    @GenericGenerator(name = "device-prefixed", strategy = "com.dk_power.power_plant_java.config.DevicePrefixedIdGenerator")
    @Where(clause = "deleted IS NOT TRUE")
    private Long id;
    private Boolean deleted = false;
    private String name;
    private String note;
    private String objectType;
    private UUID oldId;
    @Temporal(TemporalType.TIMESTAMP)
    @Column(updatable = false)
    private LocalDateTime dateCreated;
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime dateModified;
    {
        objectType = this.getClass().getSimpleName();
    }
    @CreatedBy
    @Column(nullable = false)
    private String createdBy;
    @LastModifiedBy
    private String modifiedBy;

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        BaseAuditEntity otherEntity = (BaseAuditEntity) obj;
        if(getId()!=null)return getId().equals(otherEntity.getId());
        else return false;
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
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


}
