package com.dk_power.power_plant_java.dto.plant;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PointDto extends BaseDto{
    private String label;
    private String description;
    private EquipmentTypeDto eqType;
    private List<String> files;
    private VendorDto vendor;
    private LocationDto location;
    private SystemDto system;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;

    @Override
    public String toString() {
        return "PointDto{" +
                "label='" + label + '\'' +
                ", description='" + description + '\'' +
                ", eqType=" + eqType +
                ", files=" + files +
                ", vendor=" + vendor +
                ", location=" + location +
                ", system=" + system +
                ", coordinates='" + coordinates + '\'' +
                ", originalPictureSize='" + originalPictureSize + '\'' +
                ", mainFile=" + mainFile +
                '}';
    }
}
