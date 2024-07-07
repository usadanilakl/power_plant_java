package com.dk_power.power_plant_java.entities2.users;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "roles")
@NoArgsConstructor
@Getter
@Setter
@Audited
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String name;

}
