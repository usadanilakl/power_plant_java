package com.dk_power.power_plant_java.entities.files;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@Entity
public class PID{
    private String type, name, number, vendor, system, folder;
    @Id
    @GeneratedValue
    private Long id;

    public String getLink(){
        return this.folder+this.number;
    }

}
