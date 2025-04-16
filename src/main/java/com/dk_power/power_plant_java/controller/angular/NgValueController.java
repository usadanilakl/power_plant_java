package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ng/values")
@RequiredArgsConstructor
public class NgValueController {
    private final NgValueService ngValueService;

    @GetMapping("/of-category/{alias}")
    public ResponseEntity<List<ValueDto>> getNgValues(@PathVariable String alias) {
        List<ValueDto> list = ngValueService.getValuesByCategoryAlias(alias).stream().map(ngValueService::valueToDto).toList();
        return ResponseEntity.ok(list);
    }
}
