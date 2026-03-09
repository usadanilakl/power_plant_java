package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaInstrumentLogDto {
    private String localUuid;
    private String instrumentTagNumber;
    private String instrumentDescription;
    private String status;
    private String date;
    private String time;
    private String name;
    private String comment;
    private List<PaAttachmentDto> attachments;
}
