package com.dk_power.power_plant_java.sevice.files;

import com.dk_power.power_plant_java.entities.files.FileUploader;
import com.dk_power.power_plant_java.entities.plant.FileObject;

import java.io.File;

public interface FileUploaderService {
String uploadFilesToLocal(FileUploader files);
String uploadFilesToGitHub(FileUploader files, String path);
byte[] getFileFromGitHub(String path);
void PdfToJpgConverter();
void PdfToJpgConverter(String path);
FileObject initialSave(String number, String link);
File[] getListOfFolders(String path);

}
