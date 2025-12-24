package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.*;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgConfinedSpaceService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgHotWorkService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.sikuli.script.FindFailed;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/red-tag-controls")
@RequiredArgsConstructor
public class RedTagControlsRestController {
    private final NgLotoService lotoService;
    private final NgLotoPointService lotoPointService;
    private final NgHotWorkService hotWorkService;
    private final NgSafeWorkService safeWorkService;
    private final NgConfinedSpaceService confinedSpaceService;

    private final RedTagAutomationService redTagAutomationService;



    @PostMapping
    public ResponseEntity<NgApiResponse<String>> buildPacksge(){
        try {
            redTagAutomationService.buildDailyPermitPackageTest();
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
            DailyPermitPackageDto packageDto = mapper.convertValue(dto, new TypeReference<DailyPermitPackageDto>() {});
            System.out.println("packageDto.getHotWorks().size() = " + packageDto.getHotWorks().size());

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
        } catch (Exception e) {
           return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open: " + e.getMessage()));
        }
    }

    @GetMapping("/login")
    public ResponseEntity<NgApiResponse<String>> login() {
        try {
            String login = redTagAutomationService.login();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Login "+login));
        } catch (Exception e) {
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
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-safework-form")
    public ResponseEntity<NgApiResponse<String>> fillOutSafeWorkForm() {
        try {
            SafeWork first = safeWorkService.getAll().getLast();
            if(first!=null) redTagAutomationService.fillOutSafeWorkForm(safeWorkService.toDto(first));
            else redTagAutomationService.fillOutSafeWorkFormTest();
            return ResponseEntity.ok(new NgApiResponse<>(null, "Safework Form is filled out successfully"));
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
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-cs-form")
    public ResponseEntity<NgApiResponse<String>> fillOutCsForm() {
        try {
//            String login = redTagAutomationService.fillOutCSFormTest();
            ConfinedSpace first = confinedSpaceService.getAll().getFirst();
            ConfinedSpaceDto dto = confinedSpaceService.toDto(first);
            String login = redTagAutomationService.fillOutCSForm(dto);
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
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,"App failed to open builder: " + e.getMessage()));
        }
    }

    @GetMapping("/fill-hw-form")
    public ResponseEntity<NgApiResponse<String>> fillOutHwForm() {
        try {
//            String login = redTagAutomationService.fillOutHwFormTest();
            HotWork first = hotWorkService.getAll().getFirst();
            HotWorkDto dto = hotWorkService.toDto(first);
            String login = redTagAutomationService.fillOutHwForm(dto);
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
