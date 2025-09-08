package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.*;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.sikuli.script.FindFailed;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @PostMapping("/test-data")
    public ResponseEntity<NgApiResponse<String>> testData(@RequestBody Map<String,Object> dto) {
        try {
//            System.out.println("dto.getHotWorks().size() = " + dto.getHotWorks().size());


            ObjectMapper mapper = new ObjectMapper();
//            DailyPermitPackageDto packageDto = mapper.convertValue(dto, new TypeReference<DailyPermitPackageDto>() {});
//            System.out.println("packageDto.getHotWorks().size() = " + packageDto.getHotWorks().size());

//             Deserialize "safeWorks" list from DTO map to List<SafeWorkDto>
            List<SafeWorkDto> safeWorkDtos = mapper.convertValue(
                    dto.get("safeWorks"),
                    new TypeReference<List<SafeWorkDto>>() {}
            );
            System.out.println("safeWorkDtos first workScope = " + safeWorkDtos.get(0).getWorkScope());

            // Deserialize "hotWorks" list to List<HotWorkDto>
            List<HotWorkDto> hotWorkDtos = mapper.convertValue(
                    dto.get("hotWorks"),
                    new TypeReference<List<HotWorkDto>>() {}
            );
            System.out.println("hotWorkDtos first location = " + hotWorkDtos.get(0).getForman());

            // Deserialize "confinedSpaces" list to List<ConfinedSpaceDto>
            List<ConfinedSpaceDto> confSpaces = mapper.convertValue(
                    dto.get("confinedSpaces"),
                    new TypeReference<List<ConfinedSpaceDto>>() {}
            );
            System.out.println("confinedSpaces first space = " + confSpaces.get(0).getSpace());

            // Deserialize "confinedSpaces" list to List<ConfinedSpaceDto>
            List<LotoDto> lotos = mapper.convertValue(
                    dto.get("lotos"),
                    new TypeReference<List<LotoDto>>() {}
            );
            System.out.println("lotos first space = " + lotos.size());

            return ResponseEntity.ok(new NgApiResponse<>(null, "Built successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed Building Package: " + e.getMessage()));
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

//    @GetMapping("/associate-safework-form")
//    public ResponseEntity<NgApiResponse<String>> associateOutSafeWorkForm() {
//        try {
//            String login = redTagAutomationService.associatePermits();
//            return ResponseEntity.ok(new NgApiResponse<>(null, "Safework Form associated: "+login));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to associate safe work: " + e.getMessage()));
//        }
//    }




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
            String login = redTagAutomationService.searchByPermitNumber("31845");
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
