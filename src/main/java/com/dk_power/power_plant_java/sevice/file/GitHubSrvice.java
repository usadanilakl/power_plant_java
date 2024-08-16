package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface GitHubSrvice {
    void uploadFiletoGitHub(FileDto file, String path);
    void uploadFilesToGitHub(List<FileDto> files, String path);
}
