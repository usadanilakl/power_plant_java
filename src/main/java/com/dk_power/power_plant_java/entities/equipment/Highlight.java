package com.dk_power.power_plant_java.entities.equipment;


import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted=false")
@Audited
public class Highlight extends BaseAuditEntity {

    private String coordinates;
    private String originalPictureSize;
    private Double startX;
    private Double startY;
    private Double endX;
    private Double endY;
    private Double width;
    private Double height;

    private Double pictureWidth;
    private Double pictureHeight;
    private String  tagNumber;
    private String contentType;


    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pid_highlight")
    @JsonBackReference
    private FileObject file;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "eq_highlight")
    @JsonManagedReference
    private Equipment equipment;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "connector_highlight")
    @JsonBackReference
    private FileObject connector;

    public String buildCoordinateString(){
        coordinates = "startX:"+startX+",startY:"+startY+",endX:"+endX+",endY:"+endY+",width:"+width+",height:"+height;
        return coordinates;
    }
    public Map<String,Double> buildCoordinates(){
        String[] split = coordinates.split(",");
        Map<String,Double> map = new HashMap<>();
        startX = Double.parseDouble(split[0].substring(split[0].indexOf(":")+1));
        startY = Double.parseDouble(split[1].substring(split[1].indexOf(":")+1));
        endX = Double.parseDouble(split[2].substring(split[2].indexOf(":")+1));
        endY = Double.parseDouble(split[3].substring(split[3].indexOf(":")+1));
        width = Double.parseDouble(split[4].substring(split[4].indexOf(":")+1));
        height = Double.parseDouble(split[5].substring(split[5].indexOf(":")+1));

        map.put("startX",startX);
        map.put("startY",startY);
        map.put("endX",endX);
        map.put("endY",endY);
        map.put("width",width);
        map.put("height",height);

        return map;
    }
    public String buildPictureSizeString(){
        originalPictureSize = "widht:"+pictureWidth+",height:"+pictureHeight;
        return originalPictureSize;
    }
    public Map<String, Double> buildPictureSize(){
        Map<String,Double> map = new HashMap<>();
        String[] split = originalPictureSize.split(",");
        pictureWidth = Double.parseDouble(split[0].substring(split[0].indexOf(":")+1));
        pictureHeight = Double.parseDouble(split[1].substring(split[1].indexOf(":")+1));

        map.put("width",pictureWidth);
        map.put("height",pictureHeight);

        return map;
    }
    public String identifyContent(){
        String cont = "";
        if(equipment!=null) cont = "equipment";
        else if(connector!=null) cont = "connector";
        contentType = cont;
        return cont;
    }
}