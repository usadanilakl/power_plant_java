package com.dk_power.power_plant_java.entities.plant.files;

import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class FileObject extends Group {

    public FileObject(String name, FileType fileType, String fileLink, Syst sytem, String fileNumber, Vendor vendor) {
        super(name);
        this.fileType = fileType;
        this.fileLink = fileLink;
        this.system = sytem;
        this.fileNumber = fileNumber;
        this.vendor = vendor;
    }
    public FileObject(String name) {
        super(name);
    }
    @ManyToOne
    @JoinColumn(name = "file_type_id")
    private FileType fileType;
    private String fileLink;
    private String baseLink;
    private String groupFolder;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Syst system;
    private String fileNumber;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;
    @ManyToMany
    @JoinTable(name = "file_point",
            joinColumns = @JoinColumn(name = "file_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "point_id", referencedColumnName = "id"))
    private List<Point> points;

    public void buildFileLink(){
        fileLink = baseLink+"/"+groupFolder+"/"+fileNumber;
    }

}