package com.dk_power.power_plant_java.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/print")
public class BradyController {

    String tag="";
    String description="";

    @GetMapping("/tag/{tag}/{description}")
    public String bradyIndex(Model model, @PathVariable String tag, @PathVariable String description) {
        // Add any data you want to pass to the view
        model.addAttribute("tag", tag);
        model.addAttribute("description", description);

        this.tag = tag;
        this.description = description;
        return "forward:/brady/index.html";
    }

    @GetMapping("/data")
    @ResponseBody
    public ResponseEntity<String> bradyData() {
        String jsonResponse = "{\"tag\":\"" + tag + "\",\"description\":\"" + description + "\"}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return ResponseEntity.ok()
                .headers(headers)
                .body(jsonResponse);
    }
}