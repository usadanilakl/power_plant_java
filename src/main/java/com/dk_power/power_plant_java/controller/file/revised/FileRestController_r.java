package com.dk_power.power_plant_java.controller.file.revised;

import com.azure.core.annotation.Patch;
import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileDtoLight;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/file-api")
@RequiredArgsConstructor
public class FileRestController_r {
    private final FileService fileService;
    @GetMapping("/")
    public ResponseEntity<List<FileDtoLight>> getAllLightFiles(){
        return ResponseEntity.ok(fileService.getAllLight());
    }
    @GetMapping("/{id}")
    public ResponseEntity<FileDto> getSingleFile(@PathVariable String id){
        return ResponseEntity.ok(fileService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<FileDto> createNewFile(@RequestBody FileDto eq){
        return ResponseEntity.ok(fileService.convertToDto(fileService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<FileDto> updateFile(@RequestBody FileDto eq){
        if(fileService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(fileService.convertToDto(fileService.save(eq)));
        }else{
            throw new RuntimeException("File not found");
        }
    }
    @PutMapping("/{id}/{status}")
    public ResponseEntity<FileDto> pathcFile(@PathVariable String id, @PathVariable String status){
        if(fileService.getEntityById(id)!=null) {
            System.out.println(id+ " " + status);
            Boolean stat = !status.equalsIgnoreCase("false");
            System.out.println(stat);
            FileObject entityById = fileService.getEntityById(id);
            entityById.setCompleted(stat);
            return ResponseEntity.ok(fileService.convertToDto(fileService.save(entityById)));
        }else{
            throw new RuntimeException("File not found");
        }
    }
    @PatchMapping("/")
    public ResponseEntity<FileDto> updateFilePartualy(@RequestBody FileDto eq){
        if(fileService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(fileService.convertToDto(fileService.save(eq)));
        }else{
            throw new RuntimeException("File not found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHt(@PathVariable String id){
        if(fileService.getEntityById(id)!=null) {
            fileService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Equipment not found");
        }
    }
    @GetMapping("/completed")
    public ResponseEntity<List<FileDtoLight>> getCompletedPids(){
        return ResponseEntity.ok(fileService.getCompletedPids());
    }
    @GetMapping("/incomplete")
    public ResponseEntity<List<FileDtoLight>> getIncompletePids(){

        return ResponseEntity.ok(fileService.getIncompletePids());
    }

    @GetMapping("/verify/{id}")
    public ResponseEntity<List<Map<String,String>>> verify(@PathVariable String id){
        return ResponseEntity.ok(fileService.verifyPid(id)) ;
    }
}
