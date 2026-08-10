package com.dk_power.power_plant_java.controller.rest;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true") // test-only; excluded from prod
public class TestRest {
    @GetMapping("/get-hello")
    public String getHello(){
        return "Hello";
    }
}
