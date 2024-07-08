package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
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
    private final LotoService tempLotoService;
    @GetMapping("/get-temp")
    public ResponseEntity<Loto> getTempLoto(){
        Loto tempPermit = tempLotoService.getTempPermit();
        return ResponseEntity.ok(tempPermit);
    }
}
