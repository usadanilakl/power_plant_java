package com.dk_power.power_plant_java.controller.transfer_data.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.ConflictService;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.LotoPointTransferService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/point-by-point")
public class PointByPointRestController {
    private final LotoPointTransferService lotoPointTransferService;
    private final FileService fileService;
    private final LotoPointService lotoPointService;
    private final EquipmentService equipmentService;
    private final ConflictService conflictService;
    @PostMapping
    public void transferAll() throws IOException {
        lotoPointTransferService.transferAllLotoPoints();
    }

    @PostMapping("/{id}")
    public void transferOne(@PathVariable String id) throws IOException {
        lotoPointTransferService.transferOneLotoPoint(id);
    }

    @GetMapping
    public ResponseEntity<List<LotoPointDto>> getAllNonTransferredPoints(){
        List<LotoPointDto> all = lotoPointService.getAllNotTransferred().stream().map(lotoPointService::convertToDto).toList();
        return ResponseEntity.ok(all);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<FileDto> getAllNonTransferredPointsByFileId(@PathVariable String fileId){
        FileObject file = fileService.getEntityById(fileId);
        if(file == null) return ResponseEntity.notFound().build();
        List<EquipmentDto> all = file.getPoints().stream().filter(e->e.getDataServiceItemId()==null && e.getLotoPoints()!=null && !e.getLotoPoints().isEmpty()).map(e->equipmentService.convertToDto(e)).collect(Collectors.toList());

        FileDto fileDto = fileService.convertToDto(file);
        fileDto.setPoints(new ArrayList<>(all));
        return ResponseEntity.ok(fileDto);
    }

    @GetMapping("/files")
    public ResponseEntity<List<FileDto>> getAllConflictedFiles(){
        List<FileDto> all = new ArrayList<>();
        for(FileObject pid : fileService.getByFileType("PID")){
            for(Equipment point : pid.getPoints()) {
                if(point.getDataServiceItemId()==null){
                    FileDto fileDto = new FileDto();
                    fileDto.setId(pid.getId());
                    fileDto.setFileLink(pid.getFileLink());
                    fileDto.setDocNum(fileDto.getDocNum());
                    fileDto.setFileNumber(pid.getFileNumber());
                    fileDto.setName(pid.getName());
                    fileDto.setVendor(pid.getVendor().getName());
                    all.add(fileDto);
                    break;
                }
            }
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/conflict/{id}")
    public ResponseEntity<Map<String, List<EquipmentDto>>> getConflictedPointsById(@PathVariable String id) {
        try {
            Map<String, List<EquipmentDto>> conflictMap = conflictService.getConflictedPointsById(id);

            if (conflictMap.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(conflictMap);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.emptyMap());
        }
    }
}
