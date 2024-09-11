package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileUploader;
import com.dk_power.power_plant_java.entities.files.FileObject;

import java.io.File;

public interface FileUploaderService {
String uploadFilesToLocal(FileUploader files);
String uploadFilesToGitHub(FileUploader files, String path);
byte[] getFileFromGitHub(String path);
void PdfToJpgConverter();
String PdfToJpgConverter(String path);
FileObject initialSave(String number, String link);
File[] getListOfFolders(String path);
File[] getListOfFiles(String path);
void deleteFile(String path);

}
