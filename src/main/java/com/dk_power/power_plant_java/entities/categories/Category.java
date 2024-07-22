package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String alias;

    @JsonIgnore
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private Set<Value> values = new HashSet<>();

    public boolean addValue(Value value){
        if(!values.contains(value)) return values.add(value);
        return false;
    }
    public Value getValueByName(String value){
        if(values==null || values.isEmpty()) return null;
        for (Value v : values) {
            if(v==null||v.getName()==null||v.getName().isEmpty()||v.getName().isBlank()) return null;
            else if(v.getName().trim().toLowerCase().equals(value.trim().toLowerCase())) return v;
        }
        return null;
    }

    @Override
    public String toString() {
        return "Category{" +
                "name='" + name + '\'' +
                ", id=" + getId() +
                '}';
    }
}