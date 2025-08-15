package com.dk_power.power_plant_java.entities.files;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Audited
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted=false")
public class ReferenceObject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tagNumbers;
    private String fileNumbers;

    @Lob
    private String properties;

}
