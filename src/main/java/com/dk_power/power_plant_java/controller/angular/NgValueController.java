package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/values")
@RequiredArgsConstructor
public class NgValueController {
    private final NgValueService ngValueService;

@GetMapping("/of-category/{alias}")
public ResponseEntity<NgApiResponse<List<ValueDto>>> getNgValues(@PathVariable String alias) {
    try {
        List<ValueDto> list = ngValueService.getValuesByCategoryAlias(alias)
                .stream()
                .map(ngValueService::valueToDto)
                .toList();
        
        if (list.isEmpty()) {
            return ResponseEntity.ok(new NgApiResponse<>(list, "No values found for the given category", LocalDateTime.now()));
        }
        
        return ResponseEntity.ok(new NgApiResponse<>(list, "Success", LocalDateTime.now()));
    } catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category alias: " + e.getMessage(), e);
    } catch (Exception e) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching values: " + e.getMessage(), e);
    }
}
}
