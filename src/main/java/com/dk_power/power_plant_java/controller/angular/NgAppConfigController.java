package com.dk_power.power_plant_java.controller.angular;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ng/config")
public class NgAppConfigController {

    @Value("${test.ui.enabled:false}")
    private boolean testUiEnabled;

    @GetMapping("/test-mode")
    public ResponseEntity<NgApiResponse<Boolean>> isTestMode() {
        return ResponseEntity.ok(new NgApiResponse<>(testUiEnabled, "ok"));
    }
}
