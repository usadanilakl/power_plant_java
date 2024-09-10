package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.enums.ObjectType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.*;

@MappedSuperclass
@Getter
@Setter
//@FilterDef(name = "deletedFilter", parameters = @ParamDef(name = "isDeleted", type = Boolean.class))
//@Filter(name = "deletedFilter", condition = "deleted = :isDeleted")
@NoArgsConstructor
public class BaseIdEntity {

    @Id
    @GeneratedValue
    @Where(clause = "deleted = false")
    private Long id;
    private Boolean deleted = false;
    private String name;
    private String createdBy;
//    @Enumerated(EnumType.STRING)
//    private ObjectType objectType;
    private String objectType;
    private String note;
    {
        objectType = this.getClass().getSimpleName();
    }
}
