package com.dk_power.power_plant_java.dto.maximo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MaximoDoclinkDto {
    private String href;            // doclink id (last segment of rdf:about, e.g. "21934")
    private String document;        // dcterms:identifier
    private String title;           // dcterms:title (display name)
    private String description;     // dcterms:description (often the server-side file path)
    private String urlname;         // spi:fileName (download filename)
    private String url;             // legacy field — kept for back-compat (not populated for FILE doctype)
    private String urltype;         // spi:urlType — FILE / WEB
    private String doctype;         // spi:docType
    private Long doclinksid;        // spi:docinfoid
    private String mimeType;        // dcterms:format.rdfs:label, e.g. image/jpeg
    private Long size;              // oslc_cm:attachmentSize (bytes)
    private String createdDate;     // dcterms:created
    private String modifiedDate;    // dcterms:modified
    private String createby;        // spi:createby
}
