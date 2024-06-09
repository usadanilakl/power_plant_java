package com.dk_power.power_plant_java.entities.plant;

import com.dk_power.power_plant_java.converter.GroupConverter;
import com.dk_power.power_plant_java.entities.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class Point extends Group {
    @JsonProperty("id")
    private String label;
    private String description;
    @ManyToOne
    @JoinColumn(name="eq_type_id")
    @JsonProperty("type")
    private EquipmentType eqType;
    @ManyToMany(mappedBy = "points")
    @JsonProperty("pid")
    private List<FileObject> files;
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;
    @ManyToOne
    @JoinColumn(name = "system_id")
    private Syst system;
    @JsonProperty("area")
    @Transient
    private Dimension  c;
    @Transient
    @JsonProperty("originalSize")
    private Dimension  o;
    //@JsonProperty("area")
    private String coordinates;
    //@JsonProperty("originalSize")
    private String originalPictureSize;

}
