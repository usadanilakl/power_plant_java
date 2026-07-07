package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.dk_power.power_plant_java.sevice.angular.loto.LotoImportService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/ng/lotos")
@RequiredArgsConstructor
@RestrictedAllowed
public class NgLotoController {
    private final NgLotoService ngLotoService;
    private final LotoImportService lotoImportService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
//            Page<LotoDto> paginatedLotos = ngLotoService.findAllWithProjectionPaginated(
//                    Loto.lightDtoFields,
//                    PageRequest.of(page - 1, pageSize)).map(ngLotoService::toDto);
            Page<LotoDto> paginatedLotos = ngLotoService.getAll(page-1,pageSize);
            NgApiResponse<Page<LotoDto>> response = new NgApiResponse<>(paginatedLotos, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<LotoDto>>> saveAll(@RequestBody List<LotoIdDto> lotos) {
        try {
            List<LotoDto> savedLotos = ngLotoService.saveAll(lotos);
            return ResponseEntity.ok(new NgApiResponse<>(savedLotos, "Lotos saved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error saving lotos: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoDto>> getFileById(@PathVariable Long id) {
        try {
            LotoDto lotoDto = ngLotoService.findDtoById(id).orElse(null);
            if (lotoDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoDto> response = new NgApiResponse<>(lotoDto, "LOTO retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteLoto(@PathVariable Long id) {
        try {
            ngLotoService.deleteLoto(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "LOTO deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting LOTO: " + e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngLotoService.complexSearch(criteria, page - 1, pageSize, "docNum", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngLotoService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<LotoDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }


    @GetMapping("/{id}/related-images")
    public ResponseEntity<NgApiResponse<Set<String>>> getRelatedImages(@PathVariable Long id) {
        try {
            Set<String> relatedImages = ngLotoService.getRelatedImages(id);
            NgApiResponse<Set<String>> response = new NgApiResponse<>(relatedImages, "Related images retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NgApiResponse<LotoDto>> updateLoto(@RequestBody LotoIdDto lotoDto) {
        try {
            // toDto must run in the same tx as update — lazy collections (locks,
            // points, snapshots) close with the tx, so we delegate to a single
            // service method that returns the DTO while still in-session.
            LotoDto updatedLotoDto = ngLotoService.updateAndConvert(lotoDto);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLotoDto, "LOTO updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating LOTO: " + e.getMessage()));
        }
    }

    @GetMapping("/active-with-box")
    public ResponseEntity<NgApiResponse<List<LotoDto>>> getActiveWithBox() {
        try {
            List<LotoDto> lotos = ngLotoService.getActiveWithBox();
            return ResponseEntity.ok(new NgApiResponse<>(lotos, "Active LOTOs with box retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> getActiveLotoPoints() {
        try {
            List<LotoPointDto> activeLotoPoints = ngLotoService.getActiveLotoPoints();
            NgApiResponse<List<LotoPointDto>> response = new NgApiResponse<>(activeLotoPoints, "Active LOTO points retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving active LOTO points: " + e.getMessage()));
        }
    }

    @PostMapping("/add/{pointId}/to/{lotoId}")
    public ResponseEntity<NgApiResponse<LotoDto>> addLotoPointToLoto(@PathVariable Long pointId, @PathVariable Long lotoId) {
        try {
            LotoDto updatedLoto = ngLotoService.addLotoPointToLoto(pointId, lotoId);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLoto, "LOTO point added to LOTO successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error adding LOTO point to LOTO: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/remove/{pointId}/from/{lotoId}")
    public ResponseEntity<NgApiResponse<LotoDto>> removeLotoPointFromLoto(@PathVariable Long pointId, @PathVariable Long lotoId) {
        try {
            LotoDto updatedLoto = ngLotoService.removeLotoPointFromLoto(pointId, lotoId);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLoto, "LOTO point removed from LOTO successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error removing LOTO point from LOTO: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{lotoStandardId}/related-files")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getRelatedFiles(@PathVariable Long lotoStandardId) {
        try {
            List<FileDto> relatedFiles = ngLotoService.getRelatedFiles(lotoStandardId);
            NgApiResponse<List<FileDto>> response = new NgApiResponse<>(relatedFiles, "Related files retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving related files: " + e.getMessage()));
        }
    }

    @PutMapping("/{currentLotoId}/reorder-loto-points")
    public ResponseEntity<NgApiResponse<LotoDto>> reorderLotoPoints(
            @PathVariable Long currentLotoId,
            @RequestBody List<Long> lotoPoints) {
        try {
            LotoDto reorderedLoto = ngLotoService.reorderLotoPoints(currentLotoId, lotoPoints);
            return ResponseEntity.ok(new NgApiResponse<>(reorderedLoto, "LOTO points reordered successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error reordering LOTO points: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NgApiResponse<List<Map<String, String>>>> previewImport(@RequestParam("file") MultipartFile file) {
        try {
            List<Map<String, String>> rows = lotoImportService.parseFile(file);
            return ResponseEntity.ok(new NgApiResponse<>(rows, "Parsed " + rows.size() + " rows"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error parsing file: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NgApiResponse<List<LotoDto>>> importLotos(@RequestParam("file") MultipartFile file) {
        try {
            List<LotoDto> imported = lotoImportService.importLotos(file);
            return ResponseEntity.ok(new NgApiResponse<>(imported, "Imported " + imported.size() + " LOTOs"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error importing LOTOs: " + e.getMessage()));
        }
    }

    /*********************************************************************************************************************
     * LOTO PERMIT WORKFLOW ENDPOINTS
     ******************************************************************************************************************/

    @PostMapping("/create-from-standard/{standardId}")
    public ResponseEntity<NgApiResponse<LotoDto>> createFromStandard(
            @PathVariable Long standardId,
            @RequestBody(required = false) LotoIdDto permitData,
            @RequestParam(required = false) Integer boxNumber) {
        try {
            LotoDto loto = ngLotoService.createFromStandard(standardId, permitData, boxNumber);
            return ResponseEntity.ok(new NgApiResponse<>(loto, "LOTO permit created from standard"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating LOTO: " + e.getMessage()));
        }
    }

    @PostMapping("/create-from-scratch")
    public ResponseEntity<NgApiResponse<LotoDto>> createFromScratch(
            @RequestBody(required = false) LotoIdDto permitData,
            @RequestParam(required = false) Integer boxNumber) {
        try {
            LotoDto loto = ngLotoService.createFromScratch(permitData, boxNumber);
            return ResponseEntity.ok(new NgApiResponse<>(loto, "LOTO permit created from scratch"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating LOTO: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<NgApiResponse<LotoDto>> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            LotoDto loto = ngLotoService.changeStatus(id, status);
            return ResponseEntity.ok(new NgApiResponse<>(loto, "LOTO status changed to " + status));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error changing status: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/lifecycle/ca-approve-hanging")
    public ResponseEntity<NgApiResponse<LotoDto>> approveForHanging(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.approveForHanging(id), "CA approved for hanging"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/ca-activate")
    public ResponseEntity<NgApiResponse<LotoDto>> caActivate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.caActivate(id), "CA activated"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/prerequisites")
    public ResponseEntity<NgApiResponse<LotoDto>> updatePrerequisites(
            @PathVariable Long id,
            @RequestBody Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> prerequisites) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    ngLotoService.updateInstancePrerequisites(id, prerequisites),
                    "Point prerequisites updated"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/point/{pointId}/hung")
    public ResponseEntity<NgApiResponse<LotoDto>> markPointHung(
            @PathVariable Long id, @PathVariable Long pointId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> acknowledged = body != null && body.get("acknowledged") instanceof List
                    ? (List<String>) body.get("acknowledged")
                    : null;
            String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markPointHung(id, pointId, acknowledged, notes), "Point marked hung"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @DeleteMapping("/{id}/lifecycle/point/{pointId}/hung")
    public ResponseEntity<NgApiResponse<LotoDto>> unmarkPointHung(@PathVariable Long id, @PathVariable Long pointId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.unmarkPointHung(id, pointId), "Point un-hung"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/point/{pointId}/verified")
    public ResponseEntity<NgApiResponse<LotoDto>> markPointVerified(
            @PathVariable Long id, @PathVariable Long pointId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> acknowledged = body != null && body.get("acknowledged") instanceof List
                    ? (List<String>) body.get("acknowledged")
                    : null;
            String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markPointVerified(id, pointId, acknowledged, notes), "Point marked verified"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @DeleteMapping("/{id}/lifecycle/point/{pointId}/verified")
    public ResponseEntity<NgApiResponse<LotoDto>> unmarkPointVerified(@PathVariable Long id, @PathVariable Long pointId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.unmarkPointVerified(id, pointId), "Point un-verified"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/point/{pointId}/walkdown")
    public ResponseEntity<NgApiResponse<LotoDto>> markPointWalkdown(
            @PathVariable Long id, @PathVariable Long pointId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markPointWalkdown(id, pointId, notes), "Point marked walked-down"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @DeleteMapping("/{id}/lifecycle/point/{pointId}/walkdown")
    public ResponseEntity<NgApiResponse<LotoDto>> unmarkPointWalkdown(@PathVariable Long id, @PathVariable Long pointId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.unmarkPointWalkdown(id, pointId), "Point walkdown cleared"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/point/{pointId}/removed")
    public ResponseEntity<NgApiResponse<LotoDto>> markPointRemoved(
            @PathVariable Long id, @PathVariable Long pointId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> acknowledged = body != null && body.get("acknowledged") instanceof List
                    ? (List<String>) body.get("acknowledged")
                    : null;
            String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markPointRemoved(id, pointId, acknowledged, notes), "Point marked removed"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @DeleteMapping("/{id}/lifecycle/point/{pointId}/removed")
    public ResponseEntity<NgApiResponse<LotoDto>> unmarkPointRemoved(@PathVariable Long id, @PathVariable Long pointId) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.unmarkPointRemoved(id, pointId), "Point removal cleared"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PostMapping("/{id}/lifecycle/point/{pointId}/pull-for-test")
    public ResponseEntity<NgApiResponse<LotoDto>> pullPointForTest(
            @PathVariable Long id, @PathVariable Long pointId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : null;
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.pullPointForTest(id, pointId, reason), "Point pulled — needs re-hang"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/hung")
    public ResponseEntity<NgApiResponse<LotoDto>> markHung(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markHung(id), "Recorded as hung"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/verified")
    public ResponseEntity<NgApiResponse<LotoDto>> markVerified(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.markVerified(id), "Recorded as verified"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/transfer")
    public ResponseEntity<NgApiResponse<LotoDto>> transferRequestor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String fromUser = body.get("fromUser");
            String toUser = body.get("toUser");
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.transferRequestor(id, fromUser, toUser), "Requestor transferred"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/accept")
    public ResponseEntity<NgApiResponse<LotoDto>> acceptRequestor(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.acceptRequestor(id), "Transfer accepted"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/cancel-transfer")
    public ResponseEntity<NgApiResponse<LotoDto>> cancelTransfer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.cancelTransfer(id), "Transfer cancelled"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/release-requestor")
    public ResponseEntity<NgApiResponse<LotoDto>> releaseByRequestor(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.releaseByRequestor(id), "Released by requestor"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/release-ca")
    public ResponseEntity<NgApiResponse<LotoDto>> releaseByControlAuthority(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.releaseByControlAuthority(id), "Released by control authority"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PutMapping("/{id}/lifecycle/remove-locks")
    public ResponseEntity<NgApiResponse<LotoDto>> removeLocks(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoService.removeLocks(id), "Locks removed"));
        } catch (Exception e) { e.printStackTrace(); return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage())); }
    }

    @PostMapping("/{id}/sign-on")
    public ResponseEntity<NgApiResponse<LotoDto>> signOn(
            @PathVariable Long id,
            @RequestBody PersonnelSignEntry entry) {
        try {
            LotoDto loto = ngLotoService.signOnPerson(id, entry);
            return ResponseEntity.ok(new NgApiResponse<>(loto, "Person signed on successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error signing on: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/sign-off")
    public ResponseEntity<NgApiResponse<LotoDto>> signOff(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            LotoDto loto = ngLotoService.signOffPerson(id, body.get("name"), body.get("comments"));
            return ResponseEntity.ok(new NgApiResponse<>(loto, "Person signed off successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error signing off: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/personnel")
    public ResponseEntity<NgApiResponse<List<PersonnelSignEntry>>> getPersonnel(@PathVariable Long id) {
        try {
            List<PersonnelSignEntry> personnel = ngLotoService.getPersonnel(id);
            return ResponseEntity.ok(new NgApiResponse<>(personnel, "Personnel retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/assign-locks")
    public ResponseEntity<NgApiResponse<LotoDto>> assignLocks(
            @PathVariable Long id,
            @RequestBody List<Map<String, Object>> lockAssignments) {
        try {
            LotoDto loto = ngLotoService.assignLocksToPoints(id, lockAssignments);
            return ResponseEntity.ok(new NgApiResponse<>(loto, "Locks assigned successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error assigning locks: " + e.getMessage()));
        }
    }

    @GetMapping("/usage-monitor")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getLotoUsageMonitor() {
        try {
            List<Map<String, Object>> usage = ngLotoService.getLotoUsageMonitor();
            return ResponseEntity.ok(new NgApiResponse<>(usage, "LOTO usage monitor retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/activate-all")
    public ResponseEntity<NgApiResponse<String>> activateAllLotos() {
        try {
            String result = ngLotoService.activateAllLotos();
            return ResponseEntity.ok(new NgApiResponse<>("OK", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
