package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@Table(name = "val_table")
public class Value extends BaseEntity {

    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    public void setCategory(Category category){
        if(category.getValues()==null || category.getValues().isEmpty())category.setValues(this);
        this.category = category;
    }
}