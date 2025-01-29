package com.dk_power.power_plant_java.controller.transfer_data.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.FileElementTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.FileObjectTransferService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/file-by-file")
@RequiredArgsConstructor
public class FileByFileRestController {
    private final FileObjectTransferService fileObjectTransferService;
    private final FileServiceImpl fileService;
    private final FileElementTransferService fileElementTransferService;

    @GetMapping("/next-file-for-verification")
    public ResponseEntity<FileDto> getFilesForVerification() throws IOException {
        FileDto nextFileToVerify = fileObjectTransferService.getNextFileToVerify();
        fileObjectTransferService.transferOneFile(fileService.convertToEntity(nextFileToVerify));
        EquipmentDto equipmentDto = nextFileToVerify.getPoints().stream().filter(p -> !p.getIsVerified()).findFirst().orElse(null);
        if (equipmentDto!= null) {
            //get equipment duplicates:
            //if it is U1/U2 then get other unit equipment equivalent
            nextFileToVerify.setPoints(new ArrayList<>());
            nextFileToVerify.getPoints().add(equipmentDto);
        }
        return ResponseEntity.ok(nextFileToVerify);
    }

    @GetMapping("/equipment-to-verify")
    public ResponseEntity<List<EquipmentDto>> getEquipmentToVerify() {
        //get equipment duplicates
        return ResponseEntity.ok(null); // TODO: Implement logic to get equipment to verify
    }


}
