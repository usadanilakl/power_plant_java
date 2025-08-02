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
import java.util.List;

@Controller
@RequestMapping("/print")
public class BradyController {

    String tag="";
    String description="";
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

//    @PostMapping("/list")
//    public String bradyIndexList(Model model, @RequestBody List<TagNumberPrint> tags) {
//        // Add any data you want to pass to the view
//        model.addAttribute("tags", tags);
//
//        this.tagsToPrint = tags;
//        return "forward:/brady/index1.html";
//    }
@PostMapping("/list")
public String bradyIndexList(Model model,@RequestParam("_json") String tagsJson) throws IOException {

    ObjectMapper mapper = new ObjectMapper();
    List<TagNumberPrint> tags = mapper.readValue(tagsJson, new TypeReference<List<TagNumberPrint>>() {});

    System.out.println("Got items to print: " + tags);
    model.addAttribute("tags", tags);
    this.tagsToPrint = tags;

    // Forward to Thymeleaf page
    return "forward:/brady/index1.html";
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