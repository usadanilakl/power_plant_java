package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

@Entity
@Setter
@Getter
@NoArgsConstructor
@Audited(targetAuditMode = NOT_AUDITED)
@Where(clause = "deleted=false")
public class ElectricalPanel extends BaseElectricalPanel {
    @OneToMany(mappedBy = "panel")
    @JsonBackReference
    private List<EqBreaker> eqBreakers = new ArrayList<>();
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "file_id")
    private FileObject panelSchedule;
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pic_id")
    private FileObject panelSchedulePic;
    private String voltage;
}
