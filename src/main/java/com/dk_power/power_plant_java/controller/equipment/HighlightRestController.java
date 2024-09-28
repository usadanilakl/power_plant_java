package com.dk_power.power_plant_java.controller.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.sevice.data_transfer.JsonWriterService;
import com.dk_power.power_plant_java.sevice.equipment.HighlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/highlight-api")
public class HighlightRestController {
    private final HighlightService highlightService;
    private final JsonWriterService jsonWriterService;
    @PostMapping("/")
    public ResponseEntity<HighlightDto> createEquipment(@RequestBody HighlightDto hl){
        Highlight saved = highlightService.save(hl);
        HighlightDto hlDto = highlightService.convertToDto(saved);
        if(hlDto.getEquipment().getIsUpdated()!=null)jsonWriterService.writeJsonFile("updates/"+hl.getEquipment().getIsUpdated()+".json",hlDto);
        return ResponseEntity.ok(hlDto);
    }
}
