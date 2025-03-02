package com.dk_power.power_plant_java.controller.transfer_data.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.FileObjectTransferService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

@Controller
@RequestMapping("/file-by-file")
@RequiredArgsConstructor
public class FileByFileTransferController {
    private final FileObjectTransferService fileObjectTransferService;
    private final EquipmentService equipmentService;
    private final FileService fileService;

    @GetMapping("/")
    public String fileByFileTransfer(Model model) {
//        FileDto nextFileToVerify = fileObjectTransferService.getNextFileToVerify();
//        if (nextFileToVerify == null) {
//            return "redirect:/";
//        }
//        model.addAttribute("file", nextFileToVerify);
        return "data_transfer_to_data_service_project/TransferFileByFile";
    }

    @Controller
    public class OtherUnitEquipmentController {

        @GetMapping("/other-unit-equipment")
        public String getOtherUnitEquipment(@RequestParam String equipmentId,
                                            Model model) {
            Equipment entityById = equipmentService.getEntityById(equipmentId);
            FileObject mainFile = entityById.getMainFile();
            FileDto fileDto = fileService.convertToDto(mainFile);
            EquipmentDto equipmentDto = equipmentService.convertToDto(entityById);
            fileDto.setPoints(new ArrayList<>(Collections.singletonList(equipmentDto)));

            System.out.println(fileDto.getPoints().get(0).getTagNumber());

            model.addAttribute("file", fileDto);

            // Return the name of the HTML template to render
            return "data_transfer_to_data_service_project/ShowOtherUnitEquipment";
        }
    }
}
