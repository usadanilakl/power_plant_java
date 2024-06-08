package com.dk_power.power_plant_java.sevice.files;

import com.dk_power.power_plant_java.entities.files.FileUploader;

public interface FileUploaderService {
String uploadFilesToLocal(FileUploader files);
String uploadFilesToGitHub(FileUploader files, String path);
}
