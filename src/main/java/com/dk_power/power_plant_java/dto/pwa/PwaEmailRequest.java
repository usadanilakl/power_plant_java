package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaEmailRequest {
    private String subject;
    private String body;
    private List<PaAttachmentDto> attachments;
}
