package com.dk_power.power_plant_java.controller.transfer_data.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.FileObjectTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/file-by-file")
@RequiredArgsConstructor
public class FileByFileTransferController {
    private final FileObjectTransferService fileObjectTransferService;

    @GetMapping("/")
    public String fileByFileTransfer(Model model) {
//        FileDto nextFileToVerify = fileObjectTransferService.getNextFileToVerify();
//        if (nextFileToVerify == null) {
//            return "redirect:/";
//        }
//        model.addAttribute("file", nextFileToVerify);
        return "data_transfer_to_data_service_project/TransferFileByFile";
    }
}
