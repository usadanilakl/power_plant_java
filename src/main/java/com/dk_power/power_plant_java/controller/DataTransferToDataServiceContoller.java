package com.dk_power.power_plant_java.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/data-transfer")
public class DataTransferToDataServiceContoller {
    @GetMapping
    public String showDataTransferToDataPage(){
        return "DataTransferToDataServiceProject";
    }
}
