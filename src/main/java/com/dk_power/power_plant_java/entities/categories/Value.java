package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeEntityListener;
import com.fasterxml.jackson.annotation.JsonBackReference;
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
@Where(clause = "deleted IS NOT TRUE")
@EntityListeners(FieldChangeEntityListener.class)
public class Value extends BaseAuditEntity implements Referenceable {
    public Value(String name) {
        this.name = name;
    }
    public Value(String name, String alias) {
        this.name = name;
        this.alias = alias;
    }

    private String name;

    @Column(columnDefinition = "TEXT")
    private String alias;

    @ManyToOne
    @JoinColumn(name = "category_id")
    @JsonBackReference
    private Category category;




    @Override
    public String toString() {
        return "Value{" +
                "id='" + getId() + '\'' +
                "name='" + name + '\'' +
                ", category=" + category +
                '}';
    }
}