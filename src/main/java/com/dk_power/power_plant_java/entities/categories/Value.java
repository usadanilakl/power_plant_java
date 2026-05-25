package com.dk_power.power_plant_java.entities.categories;

import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeEntityListener;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "val_table")
@Where(clause = "deleted IS NOT TRUE")
@BatchSize(size = 50)
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

    /**
     * Per-fileType policy for whether PDF uploads should be split + converted to JPG.
     * Only meaningful for Values in the "fileType" category; null on others.
     * Defaults to true on the upload side if null (preserves legacy P&ID behavior).
     */
    private Boolean convertToJpg;




    @Override
    public String toString() {
        return "Value{" +
                "id='" + getId() + '\'' +
                "name='" + name + '\'' +
                ", category=" + category +
                '}';
    }
}