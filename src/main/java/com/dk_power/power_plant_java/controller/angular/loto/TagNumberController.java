package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.sevice.angular.loto.TagNumberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/tag-numbers")
@RequiredArgsConstructor
public class TagNumberController {

    private final TagNumberService tagNumberService;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> getAllTagNumbers() {
        List<LotoPointDto> tagNumbers = tagNumberService.getAllJgTagNumbers();
        return ResponseEntity.ok(new NgApiResponse<>(tagNumbers, "Tag numbers retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<String>> createTagNumber(@RequestBody Map<String,String> tagNumber) {
        String createdTagNumber = tagNumberService.createNewTagNumber(tagNumber);
        return ResponseEntity.ok(new NgApiResponse<>(createdTagNumber, "Tag number created successfully"));
    }
}