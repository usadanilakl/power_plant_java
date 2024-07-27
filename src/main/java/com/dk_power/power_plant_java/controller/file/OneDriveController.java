package com.dk_power.power_plant_java.controller.file;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@RestController
@RequestMapping("/onedrive")
public class OneDriveController {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final RestTemplate restTemplate;

    @Autowired
    public OneDriveController(OAuth2AuthorizedClientService authorizedClientService, RestTemplateBuilder restTemplateBuilder) {
        this.authorizedClientService = authorizedClientService;
        this.restTemplate = restTemplateBuilder.build();
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        OAuth2AuthorizedClient authorizedClient = authorizedClientService.loadAuthorizedClient("6bd25e8f-d516-4e6d-a957-2c6058e54a97", "application");
        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/" + file.getOriginalFilename() + ":/content";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authorizedClient.getAccessToken().getTokenValue());
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
        ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.PUT, requestEntity, String.class);

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam("filename") String filename) {
        OAuth2AuthorizedClient authorizedClient = authorizedClientService.loadAuthorizedClient("onedrive", "application");
        String downloadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/" + filename + ":/content";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authorizedClient.getAccessToken().getTokenValue());

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
        ResponseEntity<byte[]> response = restTemplate.exchange(downloadUrl, HttpMethod.GET, requestEntity, byte[].class);

        ByteArrayResource resource = new ByteArrayResource(response.getBody());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}