package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import lombok.RequiredArgsConstructor;
import org.sikuli.script.FindFailed;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/red-tag-controls")
@RequiredArgsConstructor
public class RedTagControlsRestController {
    private final NgLotoService lotoService;
    private final NgLotoPointService lotoPointService;

    private final RedTagAutomationService redTagAutomationService;



    @PostMapping
    public ResponseEntity<NgApiResponse<String>> buildPacksge(){
        try {
            redTagAutomationService.buildDailyPermitPackage();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Built successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"Failed Building Package: " + e.getMessage()));
        }
    }




    @GetMapping("/open-app")
    public ResponseEntity<NgApiResponse<String>> openApp() {
        try {
            redTagAutomationService.openApp();
            return ResponseEntity.ok(new NgApiResponse<>(null, "App opened successfully"));
        } catch (IOException | InterruptedException | FindFailed e) {
           return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open: " + e.getMessage()));
        }
    }

    @GetMapping("/login")
    public ResponseEntity<NgApiResponse<String>> login() {
        try {
            String login = redTagAutomationService.login();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Login "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open: " + e.getMessage()));
        }
    }

    @GetMapping("/open-loto-builder")
    public ResponseEntity<NgApiResponse<String>> openLotoBuilder() {
        try {
            String login = redTagAutomationService.openNewLotoBuilder();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/build-loto-with-no-standard")
    public ResponseEntity<NgApiResponse<String>> buildLotoWithNoStandard() {
        try {
            String login = redTagAutomationService.openLotoBuilderWithNoStandard();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }



    @GetMapping("/build-loto-with-new-points")
    public ResponseEntity<NgApiResponse<String>> buildLotoWithNewPoints() {
        try {
            Loto first = lotoService.getAll().getFirst();
            List<LotoPointIdDto> lotoPoints = first.getLotoPoints();
            List<LotoPointDto> list = lotoPoints.stream().map(lotoPointService::convertIdDtoToEntity).map(lotoPointService::toDto).toList();
            String login = redTagAutomationService.buildWithNewPoints(list);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }



    @GetMapping("/complete-loto-build")
    public ResponseEntity<NgApiResponse<String>> completeLotoBuild() {
        try {
            String login = redTagAutomationService.completeLotoBuilding();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Loto Builder open operation is "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }




    @GetMapping("/open-safework-builder")
    public ResponseEntity<NgApiResponse<String>> openSafeworkBuilder() {
        try {
            String login = redTagAutomationService.openNewSafeWorkBuilder();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Safework Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-safework-form")
    public ResponseEntity<NgApiResponse<String>> fillOutSafeWorkForm() {
        try {
            String login = redTagAutomationService.fillOutSafeWorkFormTest();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Safework Form is filled out "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to fill out safe work: " + e.getMessage()));
        }
    }

    @GetMapping("/save-safework-form")
    public ResponseEntity<NgApiResponse<String>> saveOutSafeWorkForm() {
        try {
            String login = redTagAutomationService.saveSafeWork();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Safework Form saved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to save safe work: " + e.getMessage()));
        }
    }




    @GetMapping("/open-cs-builder")
    public ResponseEntity<NgApiResponse<String>> openCsBuilder() {
        try {
            String login = redTagAutomationService.openNewConfinedSpaceBuilder();
            return ResponseEntity.ok(new NgApiResponse<>(null, "CS Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-cs-form")
    public ResponseEntity<NgApiResponse<String>> fillOutCsForm() {
        try {
            String login = redTagAutomationService.fillOutCSFormTest();
            return ResponseEntity.ok(new NgApiResponse<>(null, "CS Form is filled out "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to fill out CS: " + e.getMessage()));
        }
    }

    @GetMapping("/save-cs-form")
    public ResponseEntity<NgApiResponse<String>> saveCsForm() {
        try {
            String login = redTagAutomationService.saveCsForm();
            return ResponseEntity.ok(new NgApiResponse<>(null, "CS Form saved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to save CS: " + e.getMessage()));
        }
    }




    @GetMapping("/open-hw-builder")
    public ResponseEntity<NgApiResponse<String>> openHwBuilder() {
        try {
            String login = redTagAutomationService.openNewHwBuilder();
            return ResponseEntity.ok(new NgApiResponse<>(null, "HW Builder open operation is "+login));
        } catch (FindFailed e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-hw-form")
    public ResponseEntity<NgApiResponse<String>> fillOutHwForm() {
        try {
            String login = redTagAutomationService.fillOutHwFormTest();
            return ResponseEntity.ok(new NgApiResponse<>(null, "HW Form is filled out "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to fill out HW: " + e.getMessage()));
        }
    }

    @GetMapping("/save-hw-form")
    public ResponseEntity<NgApiResponse<String>> saveHwForm() {
        try {
            String login = redTagAutomationService.saveHwForm();
            return ResponseEntity.ok(new NgApiResponse<>(null, "HW Form saved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to save HW: " + e.getMessage()));
        }
    }



    @GetMapping("/get-permit-number")
    public ResponseEntity<NgApiResponse<String>> getPermitNumber() {
        try {
            String login = redTagAutomationService.getPermitNumber();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Permit Number is retrieved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"failed to retrieve : " + e.getMessage()));
        }
    }
    @GetMapping("/get-first-row-text")
    public ResponseEntity<NgApiResponse<String>> getFirstRowText() {
        try {
            String login = redTagAutomationService.getFirstRowText();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Row Text retrieved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"failed to retrieve row text : " + e.getMessage()));
        }
    }
    @GetMapping("/search")
    public ResponseEntity<NgApiResponse<String>> search() {
        try {
            String login = redTagAutomationService.searchByPermitNumber("3025");
            return ResponseEntity.ok(new NgApiResponse<>(null, "Row Text retrieved: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"failed to retrieve row text : " + e.getMessage()));
        }
    }
    @GetMapping("/group-by-status")
    public ResponseEntity<NgApiResponse<String>> groupByStatus() {
        try {
            String login = redTagAutomationService.groupByStatus();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Grouped by status: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"failed to group : " + e.getMessage()));
        }
    }
    @GetMapping("/ungroup-by-status")
    public ResponseEntity<NgApiResponse<String>> ungroupByStatus() {
        try {
            String login = redTagAutomationService.ungroupByStatus();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Ungrouped by status: "+login));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"failed to ungroup : " + e.getMessage()));
        }
    }



}
