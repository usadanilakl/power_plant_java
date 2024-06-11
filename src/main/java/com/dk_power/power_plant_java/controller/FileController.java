package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.dto.plant.files.FileUploader;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.sevice.plant.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.FileTypeServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.SystemServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.VendorServiceImpl;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/file")
@Component
@AllArgsConstructor

public class FileController {
    private final FileUploaderService fileUploaderService;
    private final FileServiceImpl fileService;
    private final FileTypeServiceImpl fileTypeService;
    private final VendorServiceImpl vendorService;
    private final SystemServiceImpl systemService;
    @GetMapping("/upload")
    public String uploadFiles(Model model){
        model.addAttribute("files",new FileUploader());
        model.addAttribute("fileTypes", fileTypeService.getAll());
        model.addAttribute("vendors", vendorService.getAll());
        return "admin/upload";
    }
    @PostMapping("/upload")
    public String submitFiles(@ModelAttribute("files") FileUploader files, Model model){
        //String message = fileUploaderService.uploadFilesToGitHub(files,"uploads");
        String message = fileUploaderService.uploadFilesToLocal(files);
        model.addAttribute("message",message);
        return "redirect:/";
    }
    @GetMapping("/edit/{id}")
    public String editPid(@PathVariable("id") String id, Model model){
        Long pidId = Long.parseLong(id);
        FileDto file = fileService.getDtoById(pidId, FileDto.class);
        model.addAttribute("file",file);
        //model.addAttribute("files",new FileUploader());
        model.addAttribute("fileTypes", fileTypeService.getAll());
        model.addAttribute("vendors", vendorService.getAll());
        model.addAttribute("systems", systemService.getAll());
        return "admin/edit-file";
    }
    @PostMapping("/edit")
    public String updatePid(@ModelAttribute("pid") FileDto pid){
        fileService.update(pid,FileObject.class);
        return "redirect:/";
    }
    @PostMapping("/delete/{id}")
    public String deletePid(@PathVariable("id") String id){
        System.out.println("Deleting file");
        String path = fileService.delete(Long.parseLong(id));
        fileUploaderService.deleteFile("."+path);
        return "redirect:/";
    }

    @GetMapping("/get")
    public String getFiles(Model model){
        model.addAttribute("files", fileService.getAll());
        return "admin/all-files";
    }
    @GetMapping("/display/{id}")
    public String display(@PathVariable("id") String id){
        FileObject file = fileService.getById(Long.parseLong(id));
        fileUploaderService.PdfToJpgConverter("."+file.getFileLink());

        /*File reader from github*/
//        fileUploaderService.getFileFromGitHub(file.getFileLink());
//        fileUploaderService.PdfToJpgConverter();
        return "redirect:/";
    }



}
