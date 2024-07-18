package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Audited
@Table(name = "val_table")
@Where(clause = "deleted = false")
public class Value extends BaseAuditEntity {
    public Value(String name) {
        this.name = name;
    }

    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;




    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Value other = (Value) obj;
        return name != null ? name.equalsIgnoreCase(other.getName().trim()) : other.getName() == null;
    }

    @Override
    public String toString() {
        return "Value{" +
                "id='" + getId() + '\'' +
                "name='" + name + '\'' +
                ", category=" + category +
                '}';
    }
}