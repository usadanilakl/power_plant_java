package com.dk_power.power_plant_java.controller.file;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.enums.SortingGroup;
import com.dk_power.power_plant_java.sevice.file.FileUploaderService;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Data
@RestController
@RequestMapping("/data")
public class FileRestController {
    private final FileServiceImpl fileService;
    private final FileUploaderService fileUploaderService;

    @GetMapping("/get-files")
    public ResponseEntity<List<FileDto>> getFiles() {
//        return ResponseEntity.ok(fileService.getAllLight()) ;
        return ResponseEntity.ok(fileService.getAllDtos("jpg")) ;
    }

    @GetMapping("/get-vendors")
    public List<String> getAllVendors(){
        return fileService.getVendors();
    }

    @GetMapping("/get-systems")
    public List<String> getAllSystems(){
        return fileService.getSystems();
    }
    @GetMapping("/get-htPanels")
    public List<String> getAllHtPanels(){
        return fileService.getHtPanels();
    }
    @GetMapping("/get-htBrakers/{panelTag}")
    public List<HtBreakerDto> getHtBreakersByPanel(@PathVariable String panelTag){
        return fileService.getHtBrakersByPanelTag(panelTag);
    }
    @GetMapping("/get-elPanels")
    public List<String> getAllElPanels(){
        return fileService.getElPanels();
    }

    @GetMapping("/get-categories")
    public List<Map<String,String>> getAllCategories(){
        return SortingGroup.getValues();
    }

    @DeleteMapping("/delete-kiewit")
    public void deleteKiewit() {

    }

    @GetMapping("/displayPdf")
    public ResponseEntity<Resource> displayPdf() {
        String filename = "uploads/display.pdf";
        Path path = Paths.get(filename);
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/pdf"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/displayJpg")
    public ResponseEntity<Resource> displayJpg() {
        String filename = "./src/main/resources/static/1.jpg";
        Path path = Paths.get(filename);
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/jpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/display/{id}")
    public void display(@PathVariable("id") String id){
        FileObject file = fileService.getEntityById(Long.parseLong(id));
        fileUploaderService.PdfToJpgConverter("."+file.getFileLink());

    }

    @GetMapping("/get-items/{value}")
    public ResponseEntity<List<FileDto>> getItems(@PathVariable("value") String value, @RequestParam(name = "field") String field) {
        List<FileDto> items = fileService.getAllDtos();
        items = Util.filterList(items,field,value);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("itemType", "items");
        responseHeaders.set("itemHolds", "items");
        responseHeaders.set("field", value);
        return ResponseEntity.ok().headers(responseHeaders).body(items);
    }

    @GetMapping("/get-subgroups/{value}")
    public ResponseEntity<List<String>> getSubGroups(@PathVariable("value") String value) {
        List<String> items = new ArrayList<>();
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("field", value);
        responseHeaders.set("itemType", "subgroups");

        if (value.equalsIgnoreCase("vendor")) {
            responseHeaders.set("itemHolds", "items");
            items = fileService.getVendors();
        }
        if(value.equalsIgnoreCase("system")){
            responseHeaders.set("itemHolds", "items");
            items = fileService.getSystems();
        }
        return ResponseEntity.ok().headers(responseHeaders).body(items);
    }
}
