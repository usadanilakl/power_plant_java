package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;


@NoArgsConstructor
@Getter
@Setter
@Audited
@Entity
public class Category extends BaseEntity {

    private String name;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private Set<Value> values = new HashSet<>();
    public void setValues(Value value){
        if(values==null) values = new HashSet<>();
        if(value!=null){
            values.add(value);
            if(value.getCategory()==null) value.setCategory(this);
        }

    }
    public void setValues(Set<Value> values1){
        for (Value v : values1) {
            setValues(v);
        }
    }

    public boolean containsValue(String value){
        if(values==null || values.isEmpty()) return false;
        for (Value v : values) {
            if(v.getName().toLowerCase().trim().contains(value.toLowerCase().trim())) return true;
        }
        return false;
    }
}