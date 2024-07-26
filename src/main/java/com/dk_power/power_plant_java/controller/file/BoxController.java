package com.dk_power.power_plant_java.controller.file;

import com.box.sdk.BoxAPIConnection;
import com.box.sdk.BoxFile;
import com.box.sdk.BoxFolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/box")
public class BoxController {

    private final OAuth2AuthorizedClientService authorizedClientService;

    @Autowired
    public BoxController(OAuth2AuthorizedClientService authorizedClientService) {
        this.authorizedClientService = authorizedClientService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file, @RegisteredOAuth2AuthorizedClient("box") OAuth2AuthorizedClient authorizedClient) throws IOException {
        BoxAPIConnection api = new BoxAPIConnection(authorizedClient.getAccessToken().getTokenValue());

        BoxFolder rootFolder = BoxFolder.getRootFolder(api);
        BoxFile.Info newFileInfo;
        try (InputStream stream = file.getInputStream()) {
            newFileInfo = rootFolder.uploadFile(stream, file.getOriginalFilename());
        }

        return ResponseEntity.ok("File uploaded successfully. File ID: " + newFileInfo.getID());
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam("fileId") String fileId, @RegisteredOAuth2AuthorizedClient("box") OAuth2AuthorizedClient authorizedClient) throws IOException {
        BoxAPIConnection api = new BoxAPIConnection(authorizedClient.getAccessToken().getTokenValue());

        BoxFile file = new BoxFile(api, fileId);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        file.download(outputStream);

        ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getInfo().getName() + "\"")
                .body(resource);
    }
}
