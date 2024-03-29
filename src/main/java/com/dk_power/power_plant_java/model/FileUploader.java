package com.dk_power.power_plant_java.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@AllArgsConstructor
@NoArgsConstructor
@Data
public class FileUploader {
    private String type,vendor;
    private List<MultipartFile> files;
}
