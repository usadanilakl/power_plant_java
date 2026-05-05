package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoAssetDto {
    private String href;          // base64-ish OSLC resource id (e.g. "_LTEtQ0VNLVNTL0pH")
    private String assetnum;
    private String description;
    private String siteid;
    private String location;
    private String status;
    private String assettype;
    private Long assetid;
    private String parent;
    private Boolean disabled;
}
