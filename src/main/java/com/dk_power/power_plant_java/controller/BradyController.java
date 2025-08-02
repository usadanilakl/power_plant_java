package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.permits.TagNumberPrint;
import com.dk_power.power_plant_java.entities.TagNumber;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/print")
public class BradyController {

    String tag = "";
    String description = "";
    List<TagNumberPrint> tagsToPrint = new ArrayList<>();

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

//    @PostMapping(value = "/list", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public String bradyIndexList(Model model, @RequestBody List<TagNumberPrint> tags) {
//        // Add any data you want to pass to the view
//        model.addAttribute("tags", tags);
//
//        this.tagsToPrint = tags;
//        return "redirect:/brady/index1.html";
//    }

    @PostMapping(value = "/list", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, String>> bradyIndexList(@RequestBody List<TagNumberPrint> tags) {
        this.tagsToPrint = tags;

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tags received successfully");
        response.put("redirectUrl", "/brady/index1.html");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/brady/index1.html")
    public String bradyIndex1(Model model) {
        model.addAttribute("tags", this.tagsToPrint);
        return "forward:/brady/index.html";
    }


    @GetMapping("/list-data")
    @ResponseBody
    public ResponseEntity<List<TagNumberPrint>> getListToPrint() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return ResponseEntity.ok()
                .headers(headers)
                .body(tagsToPrint);
    }
}