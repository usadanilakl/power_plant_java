package com.dk_power.power_plant_java.dto.pa;

import lombok.Data;

@Data
public class PaAttachmentDto {
    private String fileName;
    private String contentType;
    private String base64Content;
}
