package com.dk_power.power_plant_java.controller.file;

import com.box.sdk.BoxDeveloperEditionAPIConnection;
import com.box.sdk.BoxFile;
import com.box.sdk.BoxFolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/box")
public class BoxController {

    private final BoxDeveloperEditionAPIConnection boxAPIConnection;

    @Autowired
    public BoxController(BoxDeveloperEditionAPIConnection boxAPIConnection) {
        this.boxAPIConnection = boxAPIConnection;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        BoxFolder rootFolder = BoxFolder.getRootFolder(boxAPIConnection);
        BoxFile.Info newFileInfo;
        try (InputStream stream = file.getInputStream()) {
            newFileInfo = rootFolder.uploadFile(stream, file.getOriginalFilename());
        }

        return ResponseEntity.ok("File uploaded successfully. File ID: " + newFileInfo.getID());
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam("fileId") String fileId) throws IOException {
        BoxFile file = new BoxFile(boxAPIConnection, fileId);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        file.download(outputStream);

        ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getInfo().getName() + "\"")
                .body(resource);
    }
}