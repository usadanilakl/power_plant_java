package com.dk_power.power_plant_java.controller.file;

import io.github.eliux.mega.MegaSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mega")
@RequiredArgsConstructor
public class MegaController {
//    private final MegaSession megaSession;
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestBody String path){
//        megaSession.uploadFile("C:/Users/usada/OneDrive/Desktop", "megacmd4j/")
//                .createRemotePathIfNotPresent()
//                .run();
        return ResponseEntity.ok("Success");
    }
}
