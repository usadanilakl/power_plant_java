package com.dk_power.power_plant_java.controller.angular.rounds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.rounds.ImportedRoundQuestionDto;
import com.dk_power.power_plant_java.dto.rounds.RoundDto;
import com.dk_power.power_plant_java.dto.rounds.RoundQuestionDto;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.BulkGenerateRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.CreateRoundRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.GenerateQuestionRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.GroupAssignObjectRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.GroupRenameRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.UpdateQuestionRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundAdminService.UpdateRoundRequest;
import com.dk_power.power_plant_java.sevice.rounds.RoundExcelImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Rounds authoring/admin (hub-served desktop workbench): import WebView headers into staging, process each into an
 * editable {@link RoundQuestion} bound to a PhysicalObject, and manage {@link com.dk_power.power_plant_java.entities.rounds.Round} definitions.
 */
@RestController
@RequestMapping("/ng/rounds-admin")
@RequiredArgsConstructor
@Slf4j
public class NgRoundsAdminController {

    private final RoundAdminService adminService;
    private final RoundExcelImportService excelImportService;

    // ── Import / staging ───────────────────────────────────────────────────────

    /** Import a manually-exported rounds Excel (the primary source): parse rows → staging, grouped by system. */
    @PostMapping(value = "/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NgApiResponse<Map<String, Object>>> importExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "No file"));
            return json(new NgApiResponse<>(excelImportService.importWorkbook(file), "Excel imported"));
        } catch (Exception e) {
            log.error("Rounds Excel import failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/import")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> importLatest() {
        try {
            Map<String, Object> result = adminService.importLatest();
            return json(new NgApiResponse<>(result, "Import complete"));
        } catch (Exception e) {
            log.error("Rounds import failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/staging")
    public ResponseEntity<NgApiResponse<List<ImportedRoundQuestionDto>>> staging(@RequestParam(required = false) String status) {
        try {
            return json(new NgApiResponse<>(adminService.listStaging(status), "Staging rows"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/staging/{id}/ignore")
    public ResponseEntity<NgApiResponse<ImportedRoundQuestionDto>> ignore(@PathVariable Long id) {
        try {
            return json(new NgApiResponse<>(adminService.ignoreStaging(id), "Ignored"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/staging/{id}/generate")
    public ResponseEntity<NgApiResponse<RoundQuestionDto>> generateFromStaging(@PathVariable Long id, @RequestBody GenerateQuestionRequest body) {
        try {
            GenerateQuestionRequest req = new GenerateQuestionRequest(id, body.roundId(), body.physicalObjectId(),
                    body.prompt(), body.answerType(), body.unit(), body.lowLimit(), body.highLimit(),
                    body.expectedValue(), body.trackIssues(), body.choicesJson());
            return json(new NgApiResponse<>(adminService.generateQuestion(req), "Question generated"));
        } catch (Exception e) {
            log.error("generateQuestion failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Generate a question from each of many staging rows, all bound to the same round + PhysicalObject (group processing). */
    @PostMapping("/staging/generate-bulk")
    public ResponseEntity<NgApiResponse<List<RoundQuestionDto>>> generateBulk(@RequestBody BulkGenerateRequest body) {
        try {
            return json(new NgApiResponse<>(adminService.generateBulk(body), "Questions generated"));
        } catch (Exception e) {
            log.error("generateBulk failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Mark many staging rows IGNORED at once. */
    @PostMapping("/staging/ignore-bulk")
    public ResponseEntity<NgApiResponse<Integer>> ignoreBulk(@RequestBody List<Long> ids) {
        try {
            return json(new NgApiResponse<>(adminService.ignoreBulk(ids), "Ignored"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Generate an ad-hoc question (no staging row) directly into a round. */
    @PostMapping("/questions")
    public ResponseEntity<NgApiResponse<RoundQuestionDto>> generateAdHoc(@RequestBody GenerateQuestionRequest body) {
        try {
            return json(new NgApiResponse<>(adminService.generateQuestion(body), "Question created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<NgApiResponse<RoundQuestionDto>> updateQuestion(@PathVariable Long id, @RequestBody UpdateQuestionRequest body) {
        try {
            return json(new NgApiResponse<>(adminService.updateQuestion(id, body), "Question updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteQuestion(@PathVariable Long id) {
        try {
            adminService.deleteQuestion(id);
            return json(new NgApiResponse<>(null, "Deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Purge staging rows (default: all unprocessed). Use to clear stale scraper-imported items. */
    @DeleteMapping("/staging")
    public ResponseEntity<NgApiResponse<Integer>> purgeStaging(@RequestParam(required = false) String status) {
        try {
            return json(new NgApiResponse<>(adminService.purgeStaging(status), "Purged"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── Rounds ─────────────────────────────────────────────────────────────────

    @PostMapping("/rounds")
    public ResponseEntity<NgApiResponse<RoundDto>> createRound(@RequestBody CreateRoundRequest body) {
        try {
            return json(new NgApiResponse<>(adminService.createRound(body), "Round created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/rounds")
    public ResponseEntity<NgApiResponse<List<RoundDto>>> listRounds() {
        try {
            return json(new NgApiResponse<>(adminService.listRounds(), "Rounds"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/rounds/{id}")
    public ResponseEntity<NgApiResponse<RoundDto>> getRound(@PathVariable Long id) {
        try {
            RoundDto dto = adminService.getRound(id);
            if (dto == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Round not found"));
            return json(new NgApiResponse<>(dto, "Round"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/rounds/{id}")
    public ResponseEntity<NgApiResponse<RoundDto>> updateRound(@PathVariable Long id, @RequestBody UpdateRoundRequest body) {
        try {
            return json(new NgApiResponse<>(adminService.updateRound(id, body), "Round updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/rounds/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteRound(@PathVariable Long id) {
        try {
            adminService.deleteRound(id);
            return json(new NgApiResponse<>(null, "Round deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/rounds/{id}/reorder")
    public ResponseEntity<NgApiResponse<RoundDto>> reorder(@PathVariable Long id, @RequestBody List<Long> orderedIds) {
        try {
            adminService.reorderQuestions(id, orderedIds);
            return json(new NgApiResponse<>(adminService.getRound(id), "Reordered"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Rename a group (merges into {@code toCategory} if it already exists). */
    @PostMapping("/rounds/{id}/group/rename")
    public ResponseEntity<NgApiResponse<RoundDto>> renameGroup(@PathVariable Long id, @RequestBody GroupRenameRequest body) {
        try {
            adminService.renameGroup(id, body.fromCategory(), body.toCategory());
            return json(new NgApiResponse<>(adminService.getRound(id), "Group renamed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Bind every question in a group to one PhysicalObject (physicalObjectId < 0 clears). */
    @PostMapping("/rounds/{id}/group/assign-object")
    public ResponseEntity<NgApiResponse<RoundDto>> assignGroupObject(@PathVariable Long id, @RequestBody GroupAssignObjectRequest body) {
        try {
            adminService.assignGroupObject(id, body.category(), body.physicalObjectId());
            return json(new NgApiResponse<>(adminService.getRound(id), "Group assigned"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Soft-delete every question in a group. */
    @DeleteMapping("/rounds/{id}/group")
    public ResponseEntity<NgApiResponse<RoundDto>> deleteGroup(@PathVariable Long id, @RequestParam String category) {
        try {
            adminService.deleteGroup(id, category);
            return json(new NgApiResponse<>(adminService.getRound(id), "Group deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private <T> ResponseEntity<NgApiResponse<T>> json(NgApiResponse<T> body) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(body);
    }
}
