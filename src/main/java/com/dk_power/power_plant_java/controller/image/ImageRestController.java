package com.dk_power.power_plant_java.controller.image;

import com.dk_power.power_plant_java.sevice.image.ImageCropper;
import com.dk_power.power_plant_java.sevice.image.OCRService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/images-api")
@RequiredArgsConstructor
public class ImageRestController {
    private final ImageCropper imageCropper;
    private final OCRService ocrService;
    private final Logger logger = LoggerFactory.getLogger(ImageRestController.class);
@PostMapping("/text")
public ResponseEntity<String> getText(@RequestBody Map<String,String> data){
    System.out.println("data = " + data);
    String imagePath = data.get("path");
    String coordinates = data.get("coordinates");
    
    logger.info("Received request to extract text from image. Path: {}, Coordinates: {}", 
                 imagePath, coordinates);
    
    try {
        imageCropper.crop(imagePath, coordinates);
        String extractedText = ocrService.extractTextFromImage(new File("cropped_image.jpg"));
        
        logger.info("Successfully extracted text from image. Path: {}, Text length: {}", 
                     imagePath, extractedText.length());
        
        return ResponseEntity.ok(extractedText);
    } catch (Exception e) {
        logger.error("Error processing image. Path: {}, Error: {}",
                      imagePath, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                             .body("Error processing image: " + e.getMessage());
    }
}

    @PostMapping(value = "/extract-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> extractTextFromUpload(@RequestParam("image") MultipartFile imageFile) {
        if (imageFile.isEmpty()) {
            return ResponseEntity.badRequest().body("Image file is required");
        }
        File tempFile = null;
        try {
            String originalName = imageFile.getOriginalFilename();
            String suffix = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf('.'))
                    : ".jpg";
            tempFile = File.createTempFile("ocr-upload-", suffix);
            imageFile.transferTo(tempFile);

            String extractedText = ocrService.extractTextFromImage(tempFile);
            return ResponseEntity.ok(extractedText);
        } catch (Exception e) {
            logger.error("Error extracting text from uploaded image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error extracting text: " + e.getMessage());
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

}
