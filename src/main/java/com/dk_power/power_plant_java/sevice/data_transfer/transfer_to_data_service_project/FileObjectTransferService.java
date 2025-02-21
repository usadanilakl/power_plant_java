package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.api.DataServiceClient;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.ApiResponse;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_FileObjectMapper;
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

import java.io.File;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FileObjectTransferService {


    private final FileServiceImpl fileService;
    private final DataServiceClient dataServiceClient;
    private final DS_FileObjectMapper dsFileObjectMapper;
    private final ConflictService conflictService;


    void cleanTransferStatus(){
        fileService.getAll().forEach(fileObject -> {
            fileObject.setDataServiceItemId(null);
            fileObject.setRefactorNotes(null);
            fileService.save(fileObject);
        });
    }

    public boolean transferOneFile(FileObject fileObject){
        if(fileObject==null) return false;
        System.out.println(fileObject.getDataServiceItemId());
        if(fileObject.getDataServiceItemId()!=null){
            DS_FileObjectDtoDS fileObjectById = dataServiceClient.getFileObjectById(fileObject.getDataServiceItemId());
            if(fileObjectById!=null){
                System.out.println("File already transferred: " + fileObject.getFileNumber() + " (ID: " + fileObject.getDataServiceItemId() + ")");
                return true;
            }else{
                System.out.println("File not found in Data Service: " + fileObject.getFileNumber() + " (ID: " + fileObject.getDataServiceItemId() + ")");
            }
        }

        DS_FileObjectDtoDS newFileObject = dsFileObjectMapper.convertToDS_FileObjectDto(fileObject);

        File file = new File(fileObject.getFileLink());
        if (!file.exists()) {
            System.out.println("File not found: " + fileObject.getFileLink());
            Conflict fileNotFoundConflict = conflictService.createFileNotFoundConflict(fileObject);
            return false;
        }

        try {
            DS_FileObjectDtoDS createdFileObject = dataServiceClient.transferFile(newFileObject, file);

            if (createdFileObject != null && createdFileObject.getId() != null) {
                System.out.println("File created successfully. ID: " + createdFileObject.getId());
                fileObject.setDataServiceItemId(createdFileObject.getId());
                fileService.save(fileObject);
            } else {
                System.out.println("Error creating file. Response was null or ID was not provided.");
            }
        } catch (Exception e) {
            System.out.println("Error during file transfer: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error during file transfer", e);
        }
        return true;
    }

    /******************************************************
     * CONNECTORS
     *******************************************************/


}
