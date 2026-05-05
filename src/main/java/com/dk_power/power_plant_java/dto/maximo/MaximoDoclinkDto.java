package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoDoclinkDto {
    private String href;            // OSLC resource id of the doclink row
    private String document;        // document number/key
    private String description;
    private String urlname;         // display name
    private String url;             // download URL (Maximo-served)
    private String urltype;         // FILE / WEB
    private String doctype;         // category (Attachments, etc.)
    private Long doclinksid;
}
