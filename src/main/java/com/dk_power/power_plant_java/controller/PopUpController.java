package com.dk_power.power_plant_java.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/popup")
public class PopUpController {
    @GetMapping("/get")
    public String getPopUp(){
        return "partials/popup";
    }
    @GetMapping("/get-html")
    public String getHtmlPopUp(){
        return "partials/popup-for-html";
    }
    @GetMapping("/form")
    public String getformPopUp(){
        return "partials/form-popup";
    }
    @GetMapping("/message")
    public String getMessagePopUp(){
        return "partials/message-popup";
    }
    @GetMapping("/eq-delete")
    public String getEqDeletePopUp(){
        return "partials/eq-delete-popup";
    }
}
