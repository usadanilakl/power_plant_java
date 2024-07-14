package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
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
public class Category extends BaseAuditEntity {
    public Category(String name) {
        this.name = name;
    }

    private String name;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private Set<Value> values = new HashSet<>();

    public boolean addValue(Value value){
        if(!values.contains(value)) return values.add(value);
        return false;
    }
    public Value getValueByName(String value){
        if(values==null || values.isEmpty()) return null;
        for (Value v : values) {
            if(v.getName().trim().toLowerCase().equals(value.trim().toLowerCase())) return v;
        }
        return null;
    }


}