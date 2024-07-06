package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.sevice.permits.impl.TempLotoService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api-lotos")
@AllArgsConstructor
public class LotoRestController {
    private final TempLotoService tempLotoService;
    @GetMapping("/get-temp")
    public ResponseEntity<TempLoto> getTempLoto(){
        TempLoto tempPermit = tempLotoService.getTempPermit();
        return ResponseEntity.ok(tempPermit);
    }
}
