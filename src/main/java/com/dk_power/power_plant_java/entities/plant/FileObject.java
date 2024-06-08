package com.dk_power.power_plant_java.entities.plant;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class FileObject extends Group {

    public FileObject(String name, FileType type, String link, Syst sytem, String number, Vendor vendor) {
        super(name);
        //this.type = type;
        this.link = link;
        //this.sytem = sytem;
        this.number = number;
        //this.vendor = vendor;
    }
    public FileObject(String name) {
        super(name);
    }

    //private FileType type;
    private String link;
    //private Syst sytem;
    private String number;
    //private Vendor vendor;
}
