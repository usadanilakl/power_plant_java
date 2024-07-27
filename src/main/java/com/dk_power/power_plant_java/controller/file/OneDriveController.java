package com.dk_power.power_plant_java.controller.file;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@RestController
@RequestMapping("/onedrive")
public class OneDriveController {

    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final RestTemplate restTemplate;

    @Autowired
    public OneDriveController(ClientRegistrationRepository clientRegistrationRepository,
                              OAuth2AuthorizedClientRepository authorizedClientRepository,
                              RestTemplateBuilder restTemplateBuilder) {
        this.authorizedClientManager = new DefaultOAuth2AuthorizedClientManager(
                clientRegistrationRepository, authorizedClientRepository);
        this.restTemplate = restTemplateBuilder.build();
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest.withClientRegistrationId("onedrive")
                .principal("application")
                .build();
        OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(authorizeRequest);
        if (authorizedClient == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authorization failed");
        }

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
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest.withClientRegistrationId("onedrive")
                .principal("application")
                .build();
        OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(authorizeRequest);
        if (authorizedClient == null) {
            System.out.println("Authorization failed");;
        }

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