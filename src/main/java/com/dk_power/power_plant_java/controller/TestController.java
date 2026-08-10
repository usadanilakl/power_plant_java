package com.dk_power.power_plant_java.controller;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/test")
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true") // test-only; excluded from prod
public class TestController {
    @GetMapping("/")
    public String showTestRunnerPate(){
        return "testRunner";
    }
}
