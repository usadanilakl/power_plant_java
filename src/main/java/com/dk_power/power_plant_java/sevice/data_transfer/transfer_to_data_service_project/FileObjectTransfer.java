package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.ApiResponse;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FileObjectTransfer {


    private final FileServiceImpl fileService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    void transferFileObjects() throws IOException {
        List<FileObject> all = fileService.getAll();
        int count = 0;
        for (FileObject fileObject : all) {
//            if(count++>20) break;
            DS_FileObjectDtoDS newFileObject = DS_FileObjectDtoDS.builder()
                    .name(fileObject.getName())
                    .fileNumber(fileObject.getFileNumber())
                    .extension(fileObject.getExtension())
                    .vendor(DS_ValueDto.builder().category(DS_CategoryDto.builder().name("Vendor").build()).name(fileObject.getVendor().getName()).build())
                    .oldPidProjectItemId(fileObject.getId())
                    .build();

            String fileObjectJson = objectMapper.writeValueAsString(newFileObject);

            MultipartEntityBuilder builder = MultipartEntityBuilder.create();

            // Add the JSON part
            builder.addTextBody("fileDto", fileObjectJson, ContentType.APPLICATION_JSON);

            // Add the file part
            File file = new File(fileObject.getFileLink());
            if (file.exists()) {
                builder.addBinaryBody("file", file, ContentType.APPLICATION_OCTET_STREAM, file.getName());
            } else {
                System.out.println("File not found: " + fileObject.getFileLink());
                // You might want to skip this iteration or handle the missing file in some way
                continue; // Skip to the next file object
            }

            HttpEntity multipartEntity = builder.build();

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost("http://localhost:8081/api/files");
                httpPost.setEntity(multipartEntity);

                try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                    int statusCode = response.getCode();
                    if (statusCode == HttpStatus.OK.value()) {
                        HttpEntity entity = response.getEntity();
                        if (entity != null) {
                            String jsonResponse = EntityUtils.toString(entity);
                            ObjectMapper mapper = new ObjectMapper();
                            ApiResponse<DS_FileObjectDtoDS> apiResponse = objectMapper.readValue(jsonResponse,
                                    new TypeReference<ApiResponse<DS_FileObjectDtoDS>>() {
                                    });

                            DS_FileObjectDtoDS createdFileObject = apiResponse.getData();
                            System.out.println("File created successfully. ID: " + createdFileObject.getId());
                            fileObject.setDataServiceItemId(createdFileObject.getId());
                            fileService.save(fileObject);
                        } else {
                            // Handle error
                            System.out.println("Error creating file. Status: " + statusCode);
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Error during file transfer: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
    }

    void cleanTransferData(){
        fileService.getAll().forEach(fileObject -> {
            fileObject.setDataServiceItemId(null);
            fileObject.setRefactorNotes(null);
            fileService.save(fileObject);
        });
    }
}
