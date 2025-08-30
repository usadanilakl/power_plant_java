package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import lombok.RequiredArgsConstructor;
import org.sikuli.script.FindFailed;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/red-tag-controls")
@RequiredArgsConstructor
public class RedTagControlsRestController {

    private final RedTagAutomationService redTagAutomationService;

    @GetMapping("/open-app")
    public ResponseEntity<NgApiResponse<String>> openApp() {
        try {
            redTagAutomationService.openApp();
            return ResponseEntity.ok(new NgApiResponse<>(null, "App opened successfully"));
        } catch (IOException | InterruptedException | FindFailed e) {
           return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open: " + e.getMessage()));
        }
    }

    @GetMapping("/login")
    public ResponseEntity<NgApiResponse<String>> login() {
        try {
            String login = redTagAutomationService.login();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Login "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open: " + e.getMessage()));
        }
    }

    @GetMapping("/open-loto-builder")
    public ResponseEntity<NgApiResponse<String>> openLotoBuilder() {
        try {
            String login = redTagAutomationService.openNewLotoBuilder();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/build-loto-with-no-standard")
    public ResponseEntity<NgApiResponse<String>> buildLotoWithNoStandard() {
        try {
            String login = redTagAutomationService.openLotoBuilderWithNoStandard();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

}
