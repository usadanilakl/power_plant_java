package com.dk_power.power_plant_java.controller.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileUploader;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.file.FileUploaderService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import lombok.AllArgsConstructor;
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
    private final CategoryService categoryService;
    @GetMapping("/upload")
    public String uploadFiles(Model model){
        model.addAttribute("files",new FileUploader());
        model.addAttribute("fileTypes", categoryService.getFileTypes());
        model.addAttribute("vendors", categoryService.getVendors());
        return "admin/upload";
    }
    @GetMapping("/onedrive")
    public String uploadPage(){
        return "file/box";
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
        FileDto file = fileService.getDtoById(pidId);
        model.addAttribute("file",file);
        //model.addAttribute("files",new FileUploader());
        model.addAttribute("fileTypes", categoryService.getFileTypes());
        model.addAttribute("vendors", categoryService.getVendors());
        model.addAttribute("systems", categoryService.getSystems());
        return "admin/edit-file";
    }
    @PostMapping("/edit")
    public String updatePid(@ModelAttribute("pid") FileDto pid){
        fileService.save(pid);
        return "redirect:/";
    }
    @PostMapping("/delete/{id}")
    public String deletePid(@PathVariable("id") String id){
        System.out.println("Deleting file");
        FileObject entity = fileService.getEntityById(id);
        fileService.softDelete(entity);
        fileUploaderService.deleteFile("."+entity.getFileLink());
        return "redirect:/";
    }

    @GetMapping("/get")
    public String getFiles(Model model){
        model.addAttribute("files", fileService.getAll());
        return "admin/all-files";
    }
    @GetMapping("/display/{id}")
    public String display(@PathVariable("id") String id){
        FileObject file = fileService.getEntityById(id);
        fileUploaderService.PdfToJpgConverter("."+file.getFileLink());

        /*File reader from github*/
//        fileUploaderService.getFileFromGitHub(file.getFileLink());
//        fileUploaderService.PdfToJpgConverter();
        return "redirect:/";
    }

    @GetMapping("/show-eq-in-file/{id}/{time}")
    public String showEqInFile(@PathVariable("id") String id,@PathVariable String time, Model model){
        model.addAttribute("eqId",id);
        model.addAttribute("time",time);
        model.addAttribute("mode","editMode");
        return "show-eq-in-file";
    }



}
