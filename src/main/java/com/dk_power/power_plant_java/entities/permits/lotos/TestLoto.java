package com.dk_power.power_plant_java.entities.permits.lotos;

import com.dk_power.power_plant_java.entities2.loto.Box;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import static org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED;

@Entity
@NoArgsConstructor
@Setter
@Getter
@Audited(targetAuditMode = NOT_AUDITED)
public class TestLoto {
    @Id
    @GeneratedValue
    private Long id;
    @OneToOne(mappedBy = "testLoto")
    private Box box;
}
