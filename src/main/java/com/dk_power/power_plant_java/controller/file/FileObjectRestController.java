package com.dk_power.power_plant_java.controller.file;

import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fileObjects")
@RequiredArgsConstructor
public class FileObjectRestController {
    private final FileService fileService;
    private final ValueService valueService;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;

    @GetMapping("/get-all-light")
    public ResponseEntity<List<FileDtoLight>> getAllFiles(){
        return ResponseEntity.ok(fileService.getAllLight());
    }
    @GetMapping("/table-view/get/{id}")
    public ResponseEntity<FileDto> getFile(@PathVariable("id")String id){
        return ResponseEntity.ok(fileService.getDtoById(id));
    }
    @GetMapping("/get-by-link/{link}")
    public ResponseEntity<FileDto> getFileByLink(@PathVariable String link){
        FileObject byFileLink = fileService.getFileByNumber(link);
        return ResponseEntity.ok(fileService.convertToDto(byFileLink));
    }

    @PostMapping("/get-by-link")
    public ResponseEntity<FileDto> getFileByLink2(@RequestBody String link){
        FileObject byFileLink = fileService.getByFileLink(link);
        return ResponseEntity.ok(fileService.convertToDto(byFileLink));
    }


}
