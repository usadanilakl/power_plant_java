package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.model.FileUploader;
import com.dk_power.power_plant_java.sevice.PidService;
import com.dk_power.power_plant_java.sevice.FileUploaderService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
@Controller
@RequestMapping("/file")
@Component
@AllArgsConstructor
@Data

public class FileController {
    private final FileUploaderService fus;
    private final PidService ps;
    @GetMapping("/upload")
    public String uploadFiles(Model model){
        model.addAttribute("files",new FileUploader());
        return "admin/upload";
    }

    @PostMapping("/upload")
    public String submitFiles(@ModelAttribute("files") FileUploader files, Model model){
       String message = fus.uploadFiles(files);
        model.addAttribute("message",message);
        //return "redirect:/admin";
        return "redirect:/admin";
    }

    @GetMapping("/get")
    public String getFiles(Model model){

        model.addAttribute("files",ps.getAllPids());
        return "admin/all-files";
    }


}
