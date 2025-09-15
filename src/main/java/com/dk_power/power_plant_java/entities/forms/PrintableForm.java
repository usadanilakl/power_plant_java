package com.dk_power.power_plant_java.entities.forms;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class PrintableForm extends BaseAuditEntity {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "printable_form_id")
    private Set<FormContainer> formContainers = new HashSet<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String size;

    public void addFormContainer(FormContainer formContainer){
        formContainers.add(formContainer);
    }
    public void removeFormContainer(FormContainer formContainer){
        formContainers.remove(formContainer);
    }
}
