package com.dk_power.power_plant_java.entities.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseElectricalPanel;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

@Entity
@Setter
@Getter
@NoArgsConstructor
@Audited(targetAuditMode = NOT_AUDITED)
public class HtPanel extends BaseElectricalPanel {
    @OneToMany(mappedBy = "panel")
    @JsonBackReference
    private List<HtBreaker> htBreakers = new ArrayList<>();
}
