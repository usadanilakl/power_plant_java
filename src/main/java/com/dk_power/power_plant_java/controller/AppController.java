package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.sevice.app_services.AppControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/server")
@RequiredArgsConstructor
public class AppController {
    private final AppControlService appControllerService;
    @GetMapping("/stop")
    public ResponseEntity<String> stopApp(){
        System.out.println("Stopping the application... \n");
        new Thread(() -> {
            try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
            System.exit(1);
        }).start();
        return ResponseEntity.ok("stopping");
    }
    @GetMapping("/ping")
    public ResponseEntity<String> pingApp(){
        return ResponseEntity.ok("pong");
    }
}
