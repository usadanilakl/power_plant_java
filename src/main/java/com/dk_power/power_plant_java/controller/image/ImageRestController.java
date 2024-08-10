package com.dk_power.power_plant_java.controller.image;

import com.dk_power.power_plant_java.sevice.image.ImageCropper;
import com.dk_power.power_plant_java.sevice.image.OCRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/images-api")
@RequiredArgsConstructor
public class ImageRestController {
    private final ImageCropper imageCropper;
    private final OCRService ocrService;
    @PostMapping("/text")
    public ResponseEntity<String> getText(@RequestBody Map<String,String> data){
        imageCropper.crop(data.get("path"), data.get("coordinates"));
        String s = ocrService.extractTextFromImage(new File("cropped_image.jpg"));
        return ResponseEntity.ok(s);
    }

}
