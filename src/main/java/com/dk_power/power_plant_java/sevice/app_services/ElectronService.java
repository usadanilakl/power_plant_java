package com.dk_power.power_plant_java.sevice.app_services;

import com.dk_power.power_plant_java.api.ElectronAppClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ElectronService {
    private final ElectronAppClient electronAppClient;
    private final ApplicationContext applicationContext;

    @Value("${app.host}")
    private String appHost;

    @PostConstruct
    public void startIsCompleted(){
        if(appHost.equalsIgnoreCase("electron"))electronAppClient.startIsCompleted();
    }

    @Scheduled(fixedRate = 3600000)
    public void checkIfElctronIsRunning(){
        if(appHost.equalsIgnoreCase("electron")) {
            String ping = electronAppClient.ping();
            if (!ping.equalsIgnoreCase("pong")) {
                System.out.println("Electron is not running");
                SpringApplication.exit(applicationContext, () -> 1);
            }
        }
    }
}
