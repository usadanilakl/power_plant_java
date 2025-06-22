package com.dk_power.power_plant_java.controller.angular.file;

import com.dk_power.power_plant_java.api.ApiResponse;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.files.FileIdDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/ng/files")
@RequiredArgsConstructor
public class NgFileRestController {
    private final NgFileService ngFileService;
    @Value("${files.root.path}")
    private String rootPath;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<FileDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
            Page<FileDto> paginatedFiles = ngFileService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "fileNumber", "name", "relatedSystems", "fileLink", "fileType.id", "fileType.name", "vendor.name", "vendor.id")),
                    PageRequest.of(page - 1, pageSize)).map(ngFileService::toDto);
            NgApiResponse<Page<FileDto>> response = new NgApiResponse<>(paginatedFiles, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<FileDto>> getFileById(@PathVariable Long id) {
        try {
            FileDto fileDto = ngFileService.findById(id).orElse(null);
            if (fileDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<FileDto> response = new NgApiResponse<>(fileDto, "File retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<FileDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<FileDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngFileService.complexSearch(criteria, page - 1, pageSize, "fileNumber", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngFileService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<FileDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/by-url")
    public ResponseEntity<NgApiResponse<FileDto>> getFileByUrl(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        try {
            FileDto fileDto = ngFileService.findByFileLink(url);
            if (fileDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<FileDto> response = new NgApiResponse<>(fileDto, "File retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<Object>> updateFile(@RequestPart("fileDto") FileIdDto fileDto,
                                                            @RequestPart(value = "file", required = false) MultipartFile file,
                                                            @RequestParam(value = "overrideFile", defaultValue = "false") boolean overrideFile) {


        try {
            List<FileDto> fileDtos = ngFileService.processPidFile(fileDto, file, overrideFile);
            return ResponseEntity.ok(new NgApiResponse<>(fileDtos, "Files updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
//        try{// Handle the file upload if a new file is provided
//            FileObject fileEntity = ngFileService.convertIdDtoToEntity(fileDto);
//            if (file != null && !file.isEmpty()) {
//
//                //Build File link
//                String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")+1);
//                fileEntity.setExtension(extension);
//                fileEntity.setBaseLink("uploads");
//                String fileLink = fileEntity.buildFolder();
//                // Process the file upload
//                fileLink = ngFileService.uploadFile(file, fileLink.replace("uploads/","").replace("uploads\\",""),overrideFile);
//                String fileNameWithoutExtension = Paths.get(fileLink).getFileName().toString().replaceFirst("[.][^.]+$", "");
//                fileEntity.setFileNumber(fileNameWithoutExtension);
//                fileEntity.buildFileLink();
//            }
//            // Update the file in the database
//            FileDto updatedFile = ngFileService.toDto(ngFileService.save(fileEntity));
//            return ResponseEntity.ok(new NgApiResponse<>(updatedFile,"File uploaded successfully", LocalDateTime.now()));
//        }catch (Exception e){
//            e.printStackTrace();
//            return ResponseEntity.badRequest().body(new NgApiResponse<FileDto>(null, e.getMessage(), LocalDateTime.now()));
//        }
    }

    @PostMapping("/check")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> checkFile(@RequestPart("fileDto") FileIdDto fileDto,
                                                                        @RequestPart("file") MultipartFile file) {
        try {
            FileObject fileEntity = ngFileService.convertIdDtoToEntity(fileDto);
            String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            fileDto.setExtension(extension);
            String fileLink = fileEntity.buildFolder();

            Map<String, Object> result = ngFileService.checkFileExists(fileLink);

            return ResponseEntity.ok(new NgApiResponse<>(result, "File check completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteFile(@PathVariable Long id) {
        try {
            ngFileService.hardDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "File deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting file: " + e.getMessage()));
        }
    }

    @GetMapping("/by-type/{fileType}")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getByFileType(@PathVariable String fileType) {
        try {
            List<FileDto> files = ngFileService.getByFileType(fileType, FileObject.lightDto);
            return ResponseEntity.ok(new NgApiResponse<>(files, "Files retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving files: " + e.getMessage()));
        }
    }

}
