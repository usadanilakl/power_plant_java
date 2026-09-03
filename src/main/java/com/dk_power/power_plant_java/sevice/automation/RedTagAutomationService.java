package com.dk_power.power_plant_java.sevice.automation;

import com.dk_power.power_plant_java.dto.automation.CsBuilderProgress;
import com.dk_power.power_plant_java.dto.automation.HwBuilderProgress;
import com.dk_power.power_plant_java.dto.automation.PermitBuildingProgress;
import com.dk_power.power_plant_java.dto.automation.SwBuilderProgress;
import com.dk_power.power_plant_java.dto.permits.*;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.sevice.angular.permits.NgConfinedSpaceService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgHotWorkService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef;
import jakarta.transaction.Transactional;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

// Pattern constants live in RedTagPatterns so that constructing them (which boots SikuliX and
// loads opencv_java430.dll) happens on first automation use rather than at Spring startup.
import static com.dk_power.power_plant_java.sevice.automation.RedTagPatterns.*;

@Service
@Transactional
public class RedTagAutomationService {
    private final Logger logger = LoggerFactory.getLogger(RedTagAutomationService.class);
    private final LotoPointMapper lotoPointMapper;
    private final NgHotWorkService hotWorkService;
    private final NgConfinedSpaceService confinedSpaceService;
    private final NgSafeWorkService safeWorkService;




    private Screen screen;
    private Region appWindow;

    private PermitBuildingProgress permitBuildingProgress;


    public RedTagAutomationService(LotoPointMapper lotoPointMapper, NgHotWorkService hotWorkService, NgConfinedSpaceService confinedSpaceService, NgSafeWorkService safeWorkService) {
        this.lotoPointMapper = lotoPointMapper;
        this.hotWorkService = hotWorkService;
        this.confinedSpaceService = confinedSpaceService;
        this.safeWorkService = safeWorkService;

        screen = new Screen(0);
        screen.setAutoWaitTimeout(30);
        Settings.TypeDelay = 0;
        Settings.MoveMouseDelay = 0;
    }

    public String openApp() {
        String appName = "Redtag.exe";
        String appPath = "J://RedTag/Redtag.exe";
        try {
            if (!isProcessRunning(appName)) {
                System.out.println("Starting " + appName + "...");
                Runtime.getRuntime().exec(appPath);

                if (isLoggedIn())
                    return "Application started and user is already logged in.";

                screen.wait(LOG_IN_BUTTON, 60);
                return "Application started. Waiting for login.";
            } else {
                System.out.println("Application is already running.");
                maximizeWindowWindows("Redtag Enterprise");
                return "Application is already running. Window maximized.";
            }
        } catch (Exception e) {
            return "Failed starting or handling application: " + e.getMessage();
        }
    }

    private void pause(int millisec) {
        try {
            Thread.sleep(millisec);
        }catch (InterruptedException e) {

        }
    }

    public String login() {
        try {
            if(isLoggedIn()) return "Already Logged In";

            this.findAndClickElement(LOG_IN_BUTTON);
            Region loginMenu = screen.wait(LOGIN_MENU, 5);
            loginMenu = new Region(loginMenu.x, loginMenu.y, loginMenu.w, loginMenu.h);

            Region inp1 = loginMenu.find(LOG_IN_INPUT_FIELD);
            inp1.offset(inp1.w / 2, inp1.h / 2).click();
            App.setClipboard(System.getProperty("user.name"));
            screen.type("v", KeyModifier.CTRL);

            Region inp2 = loginMenu.find(PASSWORD_INPUT_FIELD);
            inp2.offset(inp2.w / 2 - 20, inp2.h / 2 - 10).click();
            App.setClipboard("redtag");
            screen.type("v", KeyModifier.CTRL);

            Region btn = loginMenu.find(LOGIN_BUTTON_IN_LOGIN_MENU);
            btn.offset(btn.w / 2 - 20, btn.h / 2 - 20).click();

            if(screen.exists(FAILED_LOGIN_POPUP, 1) != null) {
                Region popup = screen.find(FAILED_LOGIN_POPUP);
                popup = new Region(popup.x, popup.y, popup.w, popup.h);
                popup.find(FAILED_LOGIN_POPUP_YES_BUTTON).click();

                Region loginMenu2 = screen.wait(LOGIN_MENU, 5);
                loginMenu2 = new Region(loginMenu.x, loginMenu.y, loginMenu.w, loginMenu.h);

                Region inp11 = loginMenu2.find(LOG_IN_INPUT_FIELD);
                inp11.offset(inp11.w / 2, inp11.h / 2).click();
                App.setClipboard("automation");
                screen.type("v", KeyModifier.CTRL);

                Region inp22 = loginMenu2.find(PASSWORD_INPUT_FIELD);
                inp22.offset(inp22.w / 2 - 20, inp22.h / 2 - 10).click();
                App.setClipboard("redtag");
                screen.type("v", KeyModifier.CTRL);
                screen.type(Key.ENTER);
                pause(200);
                screen.type(Key.ENTER);

                if(screen.exists(MAIN_MENU) != null) {
                    return "Login successful on second attempt.";
                } else {
                    return "Second login attempt failed.";
                }
            }
            if(screen.exists(MAIN_MENU) != null) {
                return "Login successful.";
            }
            return "Login failed.";
        } catch (Exception e) {
            return "Failed during login: " + e.getMessage();
        }
    }



    public void textRecognitionTest(){
        try {
            Region text = screen.wait(Paths.get(System.getProperty("user.dir"),"test-text.png").toString(),3);
            text.click();
            String text1 = text.text();
            System.out.println(text1);
        } catch (FindFailed e) {
            e.printStackTrace();
        }
    }





    public String buildDailyPermitPackageTest() {
        openApp();
        login();
        DailyPermitPackageDto packageDto = initData();

        for(HotWorkDto hw : packageDto.getHotWorks()){
            openNewHwBuilder();
            fillOutHwForm(hw);
            String permitNum = saveHwForm();
            hw.setRedTagNum(permitNum);
            System.out.println(permitNum + " HW saved");
        }

        for(ConfinedSpaceDto cs : packageDto.getConfinedSpaces()){
            openNewConfinedSpaceBuilder(cs.getCsType());
            fillOutCSForm(cs);
            String permitNum = saveCsForm();
            cs.setRedTagNum(permitNum);
            System.out.println(permitNum + " CS saved");
        }

        for (SafeWorkDto safeWork : packageDto.getSafeWorks()) {
            openNewSafeWorkBuilder();
            fillOutSafeWorkForm(safeWork);
            String permitNum = saveSafeWork();
            safeWork.setRedTagNum(permitNum);
            System.out.println(permitNum + " SW saved");
            associatePermits(packageDto);
        }

        return "success";
    }

    public String buildDailyPermitPackage(DailyPermitPackageDto packageDto) {
        permitBuildingProgress = new PermitBuildingProgress();
        permitBuildingProgress.setPackageUnderConstruction(packageDto);
        permitBuildingProgress.setOpenAppMessage(openApp());
        pause(200);
        permitBuildingProgress.setLoginMessage(login());
        pause(200);

        StringBuilder hotworks = new StringBuilder();
        StringBuilder spaces = new StringBuilder();
        String lotoNumbers = "";

        String lotoBoxes = "";
        List<LotoDto> lotos = packageDto.getLotos();
        if(lotos!=null && !lotos.isEmpty()){
            List<Integer> list = lotos.stream().map(LotoDto::getBoxNumber).toList();
            lotoBoxes = "LOTO Boxes: " + list.toString();
            lotoNumbers = lotos.stream().map(LotoDto::getDocNum).toList().toString();
        }

        for(HotWorkDto hw : packageDto.getHotWorks()){
            if(hw.getRedTagNum()!=null) continue;
            HwBuilderProgress progress = new HwBuilderProgress();
            progress.setHotWorkDto(hw);

            progress.setOpenBuilderMessage(openNewHwBuilder());
            progress.setFillOutForm(fillOutHwForm(hw));
            String permitNum = saveHwForm();
            hotworks.append(",").append(permitNum);
            hw.setRedTagNum(permitNum);
            progress.setSaveForm(permitNum);
            System.out.println(permitNum + " HW saved");
            pause(200);

            permitBuildingProgress.getHwMessages().add(progress);
            hotWorkService.save(hw);
        }

        for(ConfinedSpaceDto cs : packageDto.getConfinedSpaces()){
            if(cs.getRedTagNum()!=null) continue;
            CsBuilderProgress progress = new CsBuilderProgress();
            progress.setConfinedSpaceDto(cs);

            cs.setHotWorkNum(hotworks.toString());
            cs.setLotoNum(lotoNumbers);

            progress.setOpenBuilderMessage(openNewConfinedSpaceBuilder(cs.getCsType()));
            progress.setFillOutForm(fillOutCSForm(cs));
            String permitNum = saveCsForm();
            spaces.append(",").append(permitNum);
            cs.setRedTagNum(permitNum);
            progress.setSaveForm(permitNum);
            System.out.println(permitNum + " CS saved");
            pause(200);

            permitBuildingProgress.getCsMessages().add(progress);
            confinedSpaceService.save(cs);
        }

        for (SafeWorkDto safeWork : packageDto.getSafeWorks()) {
            if(safeWork.getRedTagNum()==null) {
                String specialInstructions = safeWork.getSpecialInstructions();
                if(specialInstructions==null){
                    specialInstructions = lotoBoxes;
                }else if(!specialInstructions.contains(lotoBoxes)) {
                    specialInstructions += ", " + lotoBoxes;
                }

                if(lotos!=null && !lotos.isEmpty())safeWork.getPermits().setLotoRequired(true);
                if(!hotworks.isEmpty()) safeWork.getPermits().setHotWork(true);
                boolean hasReclassified = packageDto.getConfinedSpaces().stream()
                        .anyMatch(c -> c.getCsType() == com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType.RECLASSIFIED);
                boolean hasPermitRequired = packageDto.getConfinedSpaces().stream()
                        .anyMatch(c -> c.getCsType() == com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType.PERMIT_REQUIRED);
                if(hasReclassified || hasPermitRequired) safeWork.getPermits().setConfinedSpace(true);

                safeWork.setSpecialInstructions(specialInstructions);

                SwBuilderProgress progress = new SwBuilderProgress();
                progress.setSafeWorkDto(safeWork);

                progress.setOpenBuilderMessage(openNewSafeWorkBuilder());
                progress.setFillOutForm(fillOutSafeWorkForm(safeWork));
                String permitNum = saveSafeWork();
                safeWork.setRedTagNum(permitNum);
                progress.setSaveForm(permitNum);
                System.out.println(permitNum + " SW saved");

                permitBuildingProgress.getSwMessages().add(progress);
                safeWorkService.save(safeWork);
            }


            associatePermits(packageDto);
            pause(200);
        }

        return "success";
    }

    public String buildLotos(DailyPermitPackageDto packageDto, long lotoId) throws FindFailed {
        List<LotoDto> lotos = packageDto.getLotos();
        LotoDto lotoDto = lotos.stream().filter(loto -> loto.getId() == lotoId).findFirst().orElseThrow();

        if(lotoDto == null) {return "Failed to find loto with id: " + lotoId;}
        openApp();
        login();

        openNewLotoBuilder();
        openLotoBuilderWithNoStandard(lotoDto);
        buildWithNewPoints(lotoDto.getLotoPoints().stream().map(lotoPointMapper::convertToDto).toList());
        return "Success";
    }

    public String buildSafeWorks(DailyPermitPackageDto packageDto, long id) throws FindFailed {
        List<SafeWorkDto> safeWorks = packageDto.getSafeWorks();
        if(id!=0)safeWorks.removeIf(sw -> !sw.getId().equals(id));

        String lotoBoxes = "";
        List<LotoDto> lotos = packageDto.getLotos();
        if(lotos!=null && !lotos.isEmpty()){
            List<Integer> list = lotos.stream().map(LotoDto::getBoxNumber).toList();
            lotoBoxes = "LOTO Boxes: " + list.toString();
        }


        openApp();
        login();
        for(SafeWorkDto safeWork : safeWorks){

            String specialInstructions = safeWork.getSpecialInstructions();
            if(specialInstructions==null){
                specialInstructions = lotoBoxes;
            }else if(!specialInstructions.contains(lotoBoxes)) {
                specialInstructions += ", " + lotoBoxes;
            }
            safeWork.setSpecialInstructions(specialInstructions);

            openNewSafeWorkBuilder();
            fillOutSafeWorkForm(safeWork);
            String permitNum = saveSafeWork();
            safeWork.setRedTagNum(permitNum);
            safeWorkService.save(safeWork);

            associatePermits(packageDto);
        }
        return "Success";
    }

    public String buildHotWorks(DailyPermitPackageDto packageDto, long id) throws FindFailed {
        List<HotWorkDto> hotWorks = packageDto.getHotWorks();
        if(id!=0)hotWorks.removeIf(hw ->!hw.getId().equals(id));

        openApp();
        login();
        for(HotWorkDto hotWork : hotWorks){
            openNewHwBuilder();
            fillOutHwForm(hotWork);
            String permitNum = saveHwForm();
            hotWork.setRedTagNum(permitNum);
            hotWorkService.save(hotWork);
        }
        return "Success";
    }

    public String buildConfinedSpaces(DailyPermitPackageDto packageDto, long id) throws FindFailed {
        List<ConfinedSpaceDto> confinedSpaces = packageDto.getConfinedSpaces();
        if(id!=0)confinedSpaces.removeIf(cs ->!cs.getId().equals(id));

        openApp();
        login();
        for(ConfinedSpaceDto confinedSpace : confinedSpaces){
            openNewConfinedSpaceBuilder(confinedSpace.getCsType());
            fillOutCSForm(confinedSpace);
            String permitNum = saveCsForm();
            confinedSpace.setRedTagNum(permitNum);
            confinedSpaceService.save(confinedSpace);
        }
        return "Success";
    }

    public String continueInterruptedProcess() {
        String failedStep = permitBuildingProgress.getFailedStep();
        if (failedStep == null) {
            return "No failed step detected";
        }
        switch (failedStep) {
            case "get-package":
                // handle package retrieval failure
                return "Handling get-package failure";
            case "open-app":
                // handle app opening failure
                return "Handling open-app failure";
            case "login":
                if(screen.exists(BLUE_EXCLAMATION, 1) != null) screen.type(Key.ENTER);
                if(screen.exists(YELLOW_EXCLAMATION, 1) != null) screen.type(Key.ENTER);
                login();
                return "Handling login failure";
            case "hw-step":
                // example for hot work step failure
                return "Handling hot work failure";
            case "cs-step":
                // example for confined space step failure
                return "Handling confined space failure";
            case "sw-step":
                // example for safe work step failure
                return "Handling safe work failure";
            default:
                return "Unknown failure step: " + failedStep;
        }
    }


    public DailyPermitPackageDto initData(){
        DailyPermitPackageDto packageDto = new DailyPermitPackageDto();
        SafeWorkDto safeWork = SafeWorkDto.createTestInstance();
        HotWorkDto hotwork = HotWorkDto.createTestInstance();
        ConfinedSpaceDto confinedSpace = ConfinedSpaceDto.createTestInstance();

        packageDto.setConfinedSpaces(new ArrayList<>(List.of(confinedSpace)));
        packageDto.setHotWorks(new ArrayList<>(List.of(hotwork)));
        packageDto.setSafeWorks(new ArrayList<>(List.of(safeWork)));

        return packageDto;

    }



    public String openNewLotoBuilder() throws FindFailed {
        screen.wait(LOTO_TAB,5).click();
        Region mainMenu = screen.wait(MAIN_MENU,2);
        mainMenu = new Region(mainMenu.x,mainMenu.y,mainMenu.w,mainMenu.h);

        Region newLotoBtn = mainMenu.wait(MAIN_MENU_NEW_ISO_BUTTON,2);
        newLotoBtn.click();
        screen.wait(NEW_ISO_LOTO_TYPE_DROPDOWN,1).click();

        if(screen.exists(ISSUE_LOTO_WITH_NO_STANDARD_BUTTON,7)!=null)return "Scucess";
        else return "Failed";

    }

    public String openLotoBuilderWithNoStandard(LotoDto loto) throws FindFailed {
        screen.wait(ISSUE_LOTO_WITH_NO_STANDARD_BUTTON,5).click();

        String workScope = loto != null && loto.getWorkScope() != null ? loto.getWorkScope() : "";
        String lotoType = loto != null && loto.getPermitType() != null && loto.getPermitType().getName() != null
                ? loto.getPermitType().getName() : "LOTO";
        String equipmentDescription = loto != null && loto.getEquipmentSystem() != null
                ? loto.getEquipmentSystem() : "";
        String equipmentTag = loto != null && loto.getDocNum() != null
                ? String.valueOf(loto.getDocNum()) : "";

        Region dropdown = screen.wait(LOTO_BUILDER_LOTO_TYPE_DROPDOWN,5);
        App.setClipboard(workScope);
        screen.type("v", KeyModifier.CTRL);
        dropdown.offset(100,0).click();
        App.setClipboard(lotoType);
        screen.type("v", KeyModifier.CTRL);

        Region eqDescr = screen.wait(LOTO_BUILDER_EQUIPMENT_DESCRIPTION,1);
        eqDescr.offset(100,0).click();
        App.setClipboard(equipmentDescription);
        screen.type("v", KeyModifier.CTRL);

        Region eqTag = screen.wait(LOTO_BUILDER_EQUIPMENT_TAG_NUMBER,1);
        eqTag.offset(100,0).click();
        App.setClipboard(equipmentTag);
        screen.type("v", KeyModifier.CTRL);


        return "Success";

    }

    public String buildWithNewPoints(List<LotoPointDto> points){
        LotoBuilderService.buildLotowWithNewPoints(points);
        return "Success";
    }

    public String saveLoto(){
        try{
            clickSaveButton();
            String num = getPermitNumber();
            return num;
        }catch (Exception e){
            e.printStackTrace();
            logger.info("Failed saving LOTO permit: " + e.getMessage());
            return "Failed saving LOTO permit: " + e.getMessage();
        }
    }

    public String completeLotoBuilding() throws FindFailed {
        screen.wait(LOTO_BUILDER_CONTINUE_BUTTON,2).click();
        Region infoForm = screen.wait(LOTO_BUILDER_INFORMATION_FORM,2);
        infoForm = new Region(infoForm.x,infoForm.y,infoForm.w,infoForm.h);

        infoForm.find(INFORMATION_FORM_LOCK_BOX_DROPDOWN).offset(100,0).click();
        screen.type("35");
//        infoForm.find(INFORMATION_FORM_LOCK_BOX_DROPDOWN).offset(100,0).click();

        infoForm.find(LOTO_REQUESTOR).offset(300,0).click();
        infoForm.find(LOTO_REQUESTOR).offset(300,0).click();
        screen.type("Sedler");

        infoForm.find(LOTO_WORK_SCOPE).offset(100,20).click();
        infoForm.find(LOTO_WORK_SCOPE).offset(100,20).click();
        screen.type("WORK SCOPE");

        infoForm.find(LOTO_REQUESTED_BY).offset(100,40).click();
        infoForm.find(LOTO_REQUESTED_BY).offset(100,40).click();
        screen.type("Sedler");

        infoForm.find(LOTO_MENU_OK_BUTTON).hover();



        return "Success";

    }




    public String openNewSafeWorkBuilder(){
        try{
            screen.wait(SAFEWORK_TAB,5).click();
            screen.wait(NEW_PERMIT_BUTTON, 1).click();
            screen.wait(ISSUE_WITH_NO_TEMPLATE_BUTTON, 3).click();
            Region shrink = screen.wait(SHRINK_BUTTON, 10);
            shrink.click();
            shrink.click();
            shrink.click();
            return "Success";
        }catch (Exception e){
            return "Failed to open safe work form builder";
        }
    }

    public String fillOutSafeWorkFormTest() {
        try{
            Region dateIssued = screen.wait(SW_DATE_ISSUED, 5);
            dateIssued.offset(0, 15).click();
            pasteText("09/07/2025");
            screen.type(Key.TAB);
            pasteText("0700");
            screen.type(Key.TAB);
            pasteText("Kiewit/Mike Miles");

            Region location = screen.find(SW_LOCATION);
            location.offset(250, 0).click();
            pasteText("HRSG U2");

            location.offset(250, 20).click();
            pasteText("Repairs");

            clickLeftSideOfElement(SW_HIGH_TEMP, 2);

            Region hiPressure = screen.find(SW_HIGH_PRESSURE);
            hiPressure.offset(-hiPressure.w / 2 - 15, 0).click();

            clickLeftSideOfElement(SW_ENERGIZED, 2);
            clickLeftSideOfElement(SW_STORED_ENERGY, 2);
            clickLeftSideOfElement(SW_EYE_HAZARD, 2);
            clickLeftSideOfElement(SW_EGRESS_ACCESS, 2);
            clickLeftSideOfElement(SW_ERGONOMIC_HAZARD, 2);
            clickLeftSideOfElement(SW_FALLING_OBJECT, 2);
            clickLeftSideOfElement(SW_HIGH_NOISE, 2);
            clickLeftSideOfElement(SW_DUST_PARTICULATE, 2);
            clickLeftSideOfElement(SW_COMBUSTABLE_DUST, 2);
            clickLeftSideOfElement(SW_FIRE_HAZARD, 2);
            clickLeftSideOfElement(SW_HOT_SURFACE, 2);
            clickLeftSideOfElement(SW_SLIPPERY, 2);
            clickLeftSideOfElement(SW_VENTILATION_REQUIRED, 2);
            clickLeftSideOfElement(SW_LIGHTING_RESTRICTIONS, 2);
            clickLeftSideOfElement(SW_CHEMICAL_EXPOSURE, 2);
            clickLeftSideOfElement(SW_LIFTING_HAZARD, 2);
            clickLeftSideOfElement(SW_HAND_TRAPS, 2);
            clickLeftSideOfElement(SW_HEAT_COLD_STRESS, 2);
            clickLeftSideOfElement(SW_ELEVATED_SURFACE, 2);
            clickLeftSideOfElement(SW_ENVIRONMENTAL, 2);

            clickYesNo(SW_LOTO_REQUIRED, true);
            clickYesNo(SW_CONFINED_SPACE_RECLASSIFIED, true);
            clickYesNo(SW_CONFINED_SPACE_PERMIT_REQUIRED, true);
            clickYesNo(SW_HOT_WORK, true);
            clickNoBelow(SW_HOT_WORK);
            clickYesNo(SW_JHA, true);
            clickYesNo(SW_GAS_TESTING, true);
            clickYesNo(SW_EXCAVATION_PERMIT, true);
            clickYesNo(SW_ENERGIZED_PERMIT, true);
            clickNoBelow(SW_ENERGIZED_PERMIT);

            screen.find(SW_ENERGIZED_PERMIT).offset(-70,20).click();

            clickYesNo(SW_HARDHAT, true);
            clickYesNo(SW_SAFETY_GLASSES, true);
            clickYesNo(SW_HEARING_PROTECTION, true);
            clickYesNo(SW_BOOTS, true);
            clickYesNo(SW_FALL_PROTECTION, true);
            clickYesNo(SW_GFI, true);
            clickYesNo(SW_RESPIRATOR, true);
            clickYesNo(SW_DUST_MASK, true);
            clickYesNo(SW_GLOVES, true);
            clickYesNo(SW_ICE_CLEATS, true);
            clickYesNo(SW_ACID_SUIT, true);
            clickYesNo(SW_BARRICADE, true);
            clickYesNo(SW_FACE_SHIELD, true);
            clickYesNo(SW_GAS_MONITOR, true);
            clickYesNo(SW_ARC_FLASH_PPE, true);
            clickYesNo(SW_WELDING_JACKET, true);
            clickYesNo(SW_WELDING_SHIELD, true);
            clickYesNo(SW_WELDING_GLOVES, true);
            clickYesNo(SW_PURGIN_VENTILATION, true);

            clickYesNo(SW_LOTO_REQUIRED, false);
            clickYesNo(SW_CONFINED_SPACE_RECLASSIFIED, false);
            clickYesNo(SW_CONFINED_SPACE_PERMIT_REQUIRED, false);
            clickYesNo(SW_HOT_WORK, false);
            clickNoBelow(SW_HOT_WORK);
            clickYesNo(SW_JHA, false);
            clickYesNo(SW_GAS_TESTING, false);
            clickYesNo(SW_EXCAVATION_PERMIT, false);
            clickYesNo(SW_ENERGIZED_PERMIT, false);
            clickNoBelow(SW_ENERGIZED_PERMIT);
            clickYesNo(SW_HARDHAT, false);
            clickYesNo(SW_SAFETY_GLASSES, false);
            clickYesNo(SW_HEARING_PROTECTION, false);
            clickYesNo(SW_BOOTS, false);
            clickYesNo(SW_FALL_PROTECTION, false);
            clickYesNo(SW_GFI, false);
            clickYesNo(SW_RESPIRATOR, false);
            clickYesNo(SW_DUST_MASK, false);
            clickYesNo(SW_GLOVES, false);
            clickYesNo(SW_ICE_CLEATS, false);
            clickYesNo(SW_ACID_SUIT, false);
            clickYesNo(SW_BARRICADE, false);
            clickYesNo(SW_FACE_SHIELD, false);
            clickYesNo(SW_GAS_MONITOR, false);
            clickYesNo(SW_ARC_FLASH_PPE, false);
            clickYesNo(SW_WELDING_JACKET, false);
            clickYesNo(SW_WELDING_SHIELD, false);
            clickYesNo(SW_WELDING_GLOVES, false);
            clickYesNo(SW_PURGIN_VENTILATION, false);

            screen.find(SW_PURGIN_VENTILATION).offset(-50,20).click();

            screen.find(SW_SPECIAL_INSTRUCTIONS).offset(0, 15).click();
            pasteText("Special instructions are here");
            screen.find(SW_REQUESTOR).offset(0, 15).click();
            pasteText("Adam Bunker");

            return "success";
        }catch (Exception e){
            return "Failed to fill out safe work form";
        }
    }

    public String fillOutSafeWorkForm(SafeWorkDto sw) {
        String currentField = "initialization";
        try{
            // Null-safety for nested objects
            SwHazards hazards = sw.getHazards() != null ? sw.getHazards() : new SwHazards();
            SwPermits permits = sw.getPermits() != null ? sw.getPermits() : new SwPermits();
            SwPpe ppe = sw.getPpe() != null ? sw.getPpe() : new SwPpe();

            // --- Header fields ---
            currentField = "Date Issued";
            Region dateIssued = screen.wait(SW_DATE_ISSUED, 5);
            dateIssued.offset(0, 15).click();
            pasteText(formatDate(sw.getDate()));
            screen.type(Key.TAB);

            currentField = "Time";
            pasteText(sw.getTime());
            screen.type(Key.TAB);

            currentField = "Company/Person";
            pasteText(sw.getCompanyPerson());

            currentField = "Location";
            Region location = screen.find(SW_LOCATION);
            location.offset(250, 0).click();
            pasteText(sw.getLocation());

            currentField = "Work Scope";
            location.offset(250, 20).click();
            pasteText(sw.getWorkScope());

            // --- Hazards section ---
            currentField = "Hazards: High Pressure";
            if (hazards.isHighPressure()) {
                Region hiPressure = screen.find(SW_HIGH_PRESSURE);
                hiPressure.offset(-hiPressure.w / 2 - 15, 0).click();
            }

            currentField = "Hazards: High Temp";
            if(hazards.isHighTemp()) clickLeftSideOfElement(SW_HIGH_TEMP, 2);

            currentField = "Hazards: Energized";
            if (hazards.isEnergized()) clickLeftSideOfElement(SW_ENERGIZED, 2);
            currentField = "Hazards: Stored Energy";
            if (hazards.isStoredEnergy()) clickLeftSideOfElement(SW_STORED_ENERGY, 2);
            currentField = "Hazards: Eye Hazard";
            if (hazards.isEyeHazard()) clickLeftSideOfElement(SW_EYE_HAZARD, 2);
            currentField = "Hazards: Egress Access";
            if (hazards.isEgressAccess()) clickLeftSideOfElement(SW_EGRESS_ACCESS, 2);
            currentField = "Hazards: Ergonomic Hazard";
            if (hazards.isErgonomicHazard()) clickLeftSideOfElement(SW_ERGONOMIC_HAZARD, 2);
            currentField = "Hazards: Falling Object";
            if (hazards.isFallingObject()) clickLeftSideOfElement(SW_FALLING_OBJECT, 2);
            currentField = "Hazards: High Noise";
            if (hazards.isHighNoise()) clickLeftSideOfElement(SW_HIGH_NOISE, 2);
            currentField = "Hazards: Dust/Particulate";
            if (hazards.isDustParticulate()) clickLeftSideOfElement(SW_DUST_PARTICULATE, 2);
            currentField = "Hazards: Combustible Dust";
            if (hazards.isCombustibleDust()) clickLeftSideOfElement(SW_COMBUSTABLE_DUST, 2);
            currentField = "Hazards: Fire Hazard";
            if (hazards.isFireHazard()) clickLeftSideOfElement(SW_FIRE_HAZARD, 2);
            currentField = "Hazards: Hot Surface";
            if (hazards.isHotSurface()) clickLeftSideOfElement(SW_HOT_SURFACE, 2);
            currentField = "Hazards: Slippery";
            if (hazards.isSlippery()) clickLeftSideOfElement(SW_SLIPPERY, 2);
            currentField = "Hazards: Ventilation Required";
            if (hazards.isVentilationRequired()) clickLeftSideOfElement(SW_VENTILATION_REQUIRED, 2);
            currentField = "Hazards: Lighting Restrictions";
            if (hazards.isLightingRestrictions()) clickLeftSideOfElement(SW_LIGHTING_RESTRICTIONS, 2);
            currentField = "Hazards: Chemical Exposure";
            if (hazards.isChemicalExposure()) clickLeftSideOfElement(SW_CHEMICAL_EXPOSURE, 2);
            currentField = "Hazards: Lifting Hazard";
            if (hazards.isLiftingHazard()) clickLeftSideOfElement(SW_LIFTING_HAZARD, 2);
            currentField = "Hazards: Hand Traps";
            if (hazards.isHandTraps()) clickLeftSideOfElement(SW_HAND_TRAPS, 2);
            currentField = "Hazards: Heat/Cold Stress";
            if (hazards.isHeatColdStress()) clickLeftSideOfElement(SW_HEAT_COLD_STRESS, 2);
            currentField = "Hazards: Elevated Surface";
            if (hazards.isElevatedSurface()) clickLeftSideOfElement(SW_ELEVATED_SURFACE, 2);
            currentField = "Hazards: Environmental";
            if (hazards.isEnvironmental()) clickLeftSideOfElement(SW_ENVIRONMENTAL, 2);

            // --- Permits section ---
            currentField = "Permits: LOTO Required";
            clickYesNo(SW_LOTO_REQUIRED, permits.isLotoRequired());
            currentField = "Permits: Confined Space";
            clickYesNo(SW_CONFINED_SPACE_RECLASSIFIED, permits.isConfinedSpace());
            clickYesNo(SW_CONFINED_SPACE_PERMIT_REQUIRED, permits.isConfinedSpace());
            currentField = "Permits: Hot Work";
            clickYesNo(SW_HOT_WORK, permits.isHotWork());
            clickNoBelow(SW_HOT_WORK);
            pause(300);
            currentField = "Permits: JHA";
            clickYesNo(SW_JHA, permits.isJha());
            currentField = "Permits: Gas Testing";
            clickYesNo(SW_GAS_TESTING, permits.isGasTesting());
            currentField = "Permits: Excavation Permit";
            clickYesNo(SW_EXCAVATION_PERMIT, permits.isExcavationPermit());
            currentField = "Permits: Energized Permit";
            clickYesNo(SW_ENERGIZED_PERMIT, permits.isEnergizedPermit());
            clickNoBelow(SW_ENERGIZED_PERMIT);

            // Scroll down to PPE section
            currentField = "Scrolling to PPE section";
            screen.find(SW_ENERGIZED_PERMIT).offset(-70,45).click();

            // --- PPE section ---
            currentField = "PPE: Hardhat";
            clickYesNo(SW_HARDHAT, ppe.isHardhat());
            currentField = "PPE: Safety Glasses";
            clickYesNo(SW_SAFETY_GLASSES, ppe.isSafetyGlasses());
            currentField = "PPE: Hearing Protection";
            clickYesNo(SW_HEARING_PROTECTION, ppe.isHearingProtection());
            currentField = "PPE: Boots";
            clickYesNo(SW_BOOTS, ppe.isBoots());
            currentField = "PPE: Fall Protection";
            clickYesNo(SW_FALL_PROTECTION, ppe.isFallProtection());
            currentField = "PPE: GFI";
            clickYesNo(SW_GFI, ppe.isGfi());
            currentField = "PPE: Respirator";
            clickYesNo(SW_RESPIRATOR, ppe.isRespiratorDustMask());
            currentField = "PPE: Dust Mask";
            clickYesNo(SW_DUST_MASK, ppe.isRespiratorDustMask());
            currentField = "PPE: Gloves";
            clickYesNo(SW_GLOVES, ppe.isGloves());
            currentField = "PPE: Ice Cleats";
            clickYesNo(SW_ICE_CLEATS, false);
            currentField = "PPE: Acid Suit";
            clickYesNo(SW_ACID_SUIT, ppe.isAcidSuit());
            currentField = "PPE: Barricade";
            clickYesNo(SW_BARRICADE, ppe.isBarricade());
            currentField = "PPE: Face Shield";
            clickYesNo(SW_FACE_SHIELD, ppe.isFaceShield());
            currentField = "PPE: Gas Monitor";
            clickYesNo(SW_GAS_MONITOR, ppe.isGasMonitor());
            currentField = "PPE: Arc Flash PPE";
            clickYesNo(SW_ARC_FLASH_PPE, ppe.isArcFlashPpe());
            currentField = "PPE: Welding Jacket";
            clickYesNo(SW_WELDING_JACKET, ppe.isWeldingPpe());
            currentField = "PPE: Welding Shield";
            clickYesNo(SW_WELDING_SHIELD, ppe.isWeldingPpe());
            currentField = "PPE: Welding Gloves";
            clickYesNo(SW_WELDING_GLOVES, ppe.isWeldingPpe());
            currentField = "PPE: Purging/Ventilation";
            clickYesNo(SW_PURGIN_VENTILATION, ppe.isPurgingVentilation());

            // Scroll down to instructions
            currentField = "Scrolling to Special Instructions";
            screen.find(SW_PURGIN_VENTILATION).offset(-50,20).click();

            currentField = "Special Instructions";
            screen.find(SW_SPECIAL_INSTRUCTIONS).offset(0, 15).click();
            pasteText(sw.getSpecialInstructions());

            currentField = "Requested By";
            screen.find(SW_REQUESTOR).offset(0, 15).click();
            pasteText(sw.getRequestedBy());

            return "success";
        }catch (Exception e){
            String errorType = e instanceof FindFailed ? "Element not found" : e.getClass().getSimpleName();
            String detail = e.getMessage() != null ? e.getMessage() : "no details";
            logger.error("Safe work form failed at field '{}': {} - {}", currentField, errorType, detail);
            return "Failed to fill out safe work form at field '" + currentField + "': " + errorType + " - " + detail;
        }
    }

    public String saveSafeWork() {
        try{
            clickSaveButton();
            String num = getPermitNumber();
            return num;
        }catch (Exception e){
            return "Failed to save safe work form";
        }
    }

    public String associatePermits(DailyPermitPackageDto packageDto) {

        try{
            List<String> one = new ArrayList<>(packageDto.getConfinedSpaces().stream().map(ConfinedSpaceDto::getWorkScope).toList());
            one.addAll(packageDto.getHotWorks().stream().map(HotWorkDto::getLocation).toList());
            List<String> two = new ArrayList<>(packageDto.getLotos().stream().map(LotoDto::getWorkScope).toList());

            screen.wait(SAFEWORK_TAB,5).click();
            clickFirstRow();
            screen.wait(SW_MODIFY_BUTTON, 5).click();
            screen.wait(SW_ASSOCIATE_BUTTON, 5).click();
            Region topBar = screen.wait(SW_ASSOCIATE_PERMITS_TOP_BAR);
            topBar.find(SW_ASSOCIATE_WINDOW_CONTROLS).click();
            Region permitTabs = screen.wait(SW_ASSOCIATE_PERMIT_TABS, 3);
            permitTabs.find(SW_ISSUED_PERMITS).click();
            Region issuedPermitsSide = screen.wait(SW_ASSOCIATE_ISSUED_SIDE, 2);
            issuedPermitsSide = new Region(issuedPermitsSide.x, issuedPermitsSide.y, issuedPermitsSide.w, issuedPermitsSide.h * 15);


            for (String s : one) {
                Region searchBtn = issuedPermitsSide.wait(SW_SEARCH_BUTTON,5);
                searchBtn.offset(0, +20).click();
                searchBtn.offset(-50, 0).click();
                pasteText(s);
                searchBtn.click();
                Region column = issuedPermitsSide.wait(SW_ASSOCIATE_PERMIT_NUMBER_COLUMN,5);
                clickInactiveOrFirstRow(issuedPermitsSide, column);
            }
            permitTabs.find(SW_ASSOCIATE_ISSUED_LOTOS).click();

            for (String s : two) {
                Region searchBtn = issuedPermitsSide.wait(SW_SEARCH_BUTTON, 5);
                searchBtn.offset(0, +20).click();
                searchBtn.offset(-50, 0).click();
                pasteText(s);
                searchBtn.click();
                Region column = issuedPermitsSide.wait(SW_ASSOCIATED_LOTO_NUM_COLUMN,5);
                column.offset(0, 12).click();
                column.offset(0, 12).click();
            }
//            screen.wait(SW_CONTINUE_BUTTON,1).click();
//            clickSaveButton();
            return "success";
        }catch (Exception e){
            return  "Failed to associate permits";
        }
    }



    public String openNewConfinedSpaceBuilder(com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType csType) {
        try {
            Pattern tab = csType == com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType.RECLASSIFIED
                    ? CS_TAB_RECLASSIFIED
                    : CS_TAB_PERMIT_REQUIRED;
            screen.wait(tab,5).click();
            screen.wait(NEW_PERMIT_BUTTON, 1).click();
            screen.wait(ISSUE_WITH_NO_TEMPLATE_BUTTON, 3).click();
            Region shrink = screen.wait(SHRINK_BUTTON, 10);
            shrink.click();
            shrink.click();
            shrink.click();
            return "Success";
        } catch (Exception e) {
            return "Failed opening New Confined Space Builder: " + e.getMessage();
        }
    }

    public String fillOutCSFormTest() throws FindFailed{
        screen.wait(CS_SPACE,1);
        clickRightSideOfElement(CS_SPACE,20);
        pasteText("Test Space");
        clickRightSideOfElement(CS_PURPOSE,20);
        pasteText("Testing");
        clickRightSideOfElement(CS_ISSUED_TO,20);
        pasteText("Test Person");
        clickRightSideOfElement(CS_ENTRY_DATE,20);
        pasteText(LocalDateTime.now().toString());
        clickRightSideOfElement(CS_START_TIME,20);
        pasteText("0700");
        clickRightSideOfElement(CS_DURATION,20);
        pasteText("12 hours");

        clickLeftSideOfElement(CS_OXIGEN_DEFF,5);
        clickLeftSideOfElement(CS_FLAMEBLE_GAS,5);
        clickLeftSideOfElement(CS_COMBUSTIBLE_DUST,5);
        clickLeftSideOfElement(CS_TOXIC_GAS,5);
        clickLeftSideOfElement(CS_ROTATING_EQ,5);
        clickLeftSideOfElement(CS_ELECTRICAL_SHOCK,5);
        clickLeftSideOfElement(CS_ENTRAPMENT,5);
        clickLeftSideOfElement(CS_ENGULFMENT,5);
        clickLeftSideOfElement(CS_HEAT_STRESS,5);
        clickLeftSideOfElement(CS_FACE_SHIELD,5);
        clickLeftSideOfElement(CS_GFCI,5);
        clickLeftSideOfElement(CS_LOW_VOLTAGE_TOOLS,5);
        clickLeftSideOfElement(CS_EXPLOSIONPROOF_TOOLS,5);
        clickLeftSideOfElement(CS_NONSPARKING_TOOLS,5);
        clickLeftSideOfElement(CS_FALL_PROTECTION,5);
        clickLeftSideOfElement(CS_RETRIVAL_SYSTEM,5);
        clickLeftSideOfElement(CS_LIFE_LINE,5);
        clickLeftSideOfElement(CS_ATM_METER,5);
        clickLeftSideOfElement(CS_TRIPOD,5);

        clickRightSideOfElement(CS_LOTO,20);
        pasteText("123456");
        clickRightSideOfElement(CS_HOT_WORK,20);
        pasteText("654321");
        clickLeftSideOfElement(CS_VENTILATION,5);
        clickLeftSideOfElement(CS_BLANK_FLANGED,5);
        clickLeftSideOfElement(CS_W_BLOCK,5);

        Region meterData = screen.find(CS_METER_DATA);
        int width = meterData.w / 2-5;
        int height = meterData.h/2;
        meterData.offset(width,30-height).click();
        pasteText(LocalDateTime.now().toString());

//        try{Thread.sleep(1000);}catch (Exception e){}

        meterData.offset(width,60-height).click();
        pasteText("RKI GX-3R PRO");

//        try{Thread.sleep(1000);}catch (Exception e){}

        meterData.offset(width,90-height).click();
        pasteText("3");

//        try{Thread.sleep(1000);}catch (Exception e){}

        meterData.offset(width,120-height).click();
        pasteText(LocalDateTime.now().toString());

//        try{Thread.sleep(1000);}catch (Exception e){}

        meterData.offset(width,140-height).click();
        pasteText("Y");

        return "success";
    }

    public String fillOutCSForm(ConfinedSpaceDto cs){
        try {
            screen.wait(CS_SPACE, 5);
            clickRightSideOfElement(CS_SPACE, 20);
            pasteText(cs.getSpace());
            clickRightSideOfElement(CS_PURPOSE, 20);
            pasteText(cs.getWorkScope());
            clickRightSideOfElement(CS_ISSUED_TO, 20);
            pasteText(cs.getIssuedTo());
            clickRightSideOfElement(CS_ENTRY_DATE, 20);
            pasteText(formatDate(cs.getDate()));
            clickRightSideOfElement(CS_START_TIME, 20);
            pasteText(cs.getTime());
            clickRightSideOfElement(CS_DURATION, 20);
            pasteText(cs.getDuration());

            if (cs.getHazards().isOxygenDeficiency()) clickLeftSideOfElement(CS_OXIGEN_DEFF, 5);
            if (cs.getHazards().isFlammableGas()) clickLeftSideOfElement(CS_FLAMEBLE_GAS, 5);
            if (cs.getHazards().isCombustibleDust()) clickLeftSideOfElement(CS_COMBUSTIBLE_DUST, 5);
            if (cs.getHazards().isToxicGas()) clickLeftSideOfElement(CS_TOXIC_GAS, 5);
            if (cs.getHazards().isRotatingEquipment()) clickLeftSideOfElement(CS_ROTATING_EQ, 5);
            if (cs.getHazards().isElectricalShock()) clickLeftSideOfElement(CS_ELECTRICAL_SHOCK, 5);
            if (cs.getHazards().isEntrapment()) clickLeftSideOfElement(CS_ENTRAPMENT, 5);
            if (cs.getHazards().isEngulfment()) clickLeftSideOfElement(CS_ENGULFMENT, 5);
            if (cs.getHazards().isHeatStress()) clickLeftSideOfElement(CS_HEAT_STRESS, 5);

            if (cs.getPpe().isFaceShield()) clickLeftSideOfElement(CS_FACE_SHIELD, 5);
            if (cs.getPpe().isFcfi()) clickLeftSideOfElement(CS_GFCI, 5);
            if (cs.getPpe().isLovVoltageTools()) clickLeftSideOfElement(CS_LOW_VOLTAGE_TOOLS, 5);
            if (cs.getPpe().isExplosionProofTools()) clickLeftSideOfElement(CS_EXPLOSIONPROOF_TOOLS, 5);
            if (cs.getPpe().isNonSparkingTools()) clickLeftSideOfElement(CS_NONSPARKING_TOOLS, 5);
            if (cs.getPpe().isFallProtection()) clickLeftSideOfElement(CS_FALL_PROTECTION, 5);
            if (cs.getPpe().isRetrievalSystem()) clickLeftSideOfElement(CS_RETRIVAL_SYSTEM, 5);
            if (cs.getPpe().isLifeline()) clickLeftSideOfElement(CS_LIFE_LINE, 5);
            if (cs.getPpe().isPersonalAtmosphericMeter()) clickLeftSideOfElement(CS_ATM_METER, 5);
            if (cs.getPpe().isTripod()) clickLeftSideOfElement(CS_TRIPOD, 5);


            if (cs.getLotoNum() != null && !cs.getLotoNum().isEmpty()) {
                clickRightSideOfElement(CS_LOTO, 20);
                pasteText(cs.getLotoNum());
            }
            if (cs.getHotWorkNum() != null && !cs.getHotWorkNum().isEmpty()) {
                clickRightSideOfElement(CS_HOT_WORK, 20);
                pasteText(cs.getHotWorkNum());
            }
            if (cs.isVentilation()) clickLeftSideOfElement(CS_VENTILATION, 5);
            if (cs.isBlankFlanged()) clickLeftSideOfElement(CS_BLANK_FLANGED, 5);
            if (cs.isBlankFlanged()) clickLeftSideOfElement(CS_W_BLOCK, 5);

            Region meterData = screen.find(CS_METER_DATA);
            int width = meterData.w / 2 - 5;
            int height = meterData.h / 2;
            meterData.offset(width, 30 - height).click();
            pasteText(formatDate(cs.getDate()));

            meterData.offset(width, 60 - height).click();
            pasteText(cs.getMeterModel());

//            meterData.offset(width, 90 - height).click();
//            pasteText(cs.getMeterNum());

            meterData.offset(width, 120 - height).click();
            pasteText(formatDate(cs.getDate()));

            meterData.offset(width, 140 - height).click();
            pasteText("Y");

            return "success";
        }catch (Exception e){
            return "Failed to fill out confined space form";
        }
    }

    public String saveCsForm(){
        try{
            clickSaveButton();
            String num = getPermitNumber();
            return num;
        }catch (Exception e){
            return "Failed to save confined space";
        }
    }



    public String openNewHwBuilder() {
        try {
            screen.wait(HW_TAB,5).click();
            screen.wait(NEW_PERMIT_BUTTON, 1).click();
            screen.wait(ISSUE_WITH_NO_TEMPLATE_BUTTON, 3).click();
            Region shrink = screen.wait(SHRINK_BUTTON, 10);
            shrink.click();
            shrink.click();
            shrink.click();
            return "Successfully opened hot work form builder";
        } catch (Exception e) {
            return "Failed opening New Hw Builder: " + e.getMessage();
        }
    }

    public String fillOutHwFormTest() throws FindFailed{
        Region location = screen.wait(HW_LOCATION,2);
        location.offset(location.w/2-5,0).click();
        pasteText("Test Location");
        screen.type(Key.TAB);
        pasteText(LocalDateTime.now().toString());
        screen.type(Key.TAB);
        pasteText("Test Person Performing Work");
        screen.type(Key.TAB);
        pasteText("Test Fire Watch Name");

        Region model = screen.wait(HW_METER_MODEL,2);
        model.offset(model.w/2-5,0).click();
        pasteText("RKI GX-3R PRO");
        screen.type(Key.TAB);
        pasteText("test");
        screen.type(Key.TAB);
        pasteText(LocalDateTime.now().toString());

        clickRightSideOfElement(HW_FIRE_WATCH_REQUIRED,-2);
//
        Region check = screen.wait(HW_MEASURES_TAKEN_CKECKBOXES,2);
        int wY = 5-check.w/2;
        int wN = check.w/2-12;
        int h = 7-check.h/2;

        check.offset(wY,h).click();
        check.offset(wN,h).click();
        check.offset(wY,h+25).click();
        check.offset(wN,h+25).click();
        check.offset(wY,h+50).click();
        check.offset(wN,h+50).click();
        check.offset(wY,h+75).click();
        check.offset(wN,h+75).click();
        check.offset(wY,h+100).click();
        check.offset(wN,h+100).click();

        int correction = 7;

        check.offset(wY,h+150-correction).click();
        check.offset(wN,h+150-correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        check.offset(wY,h+175-correction).click();
        check.offset(wN,h+175-correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        correction = 25;
        check.offset(wY,h+200-correction+3).click();
        check.offset(wN,h+200-correction+3).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        check.offset(wY,h+225-correction).click();
        check.offset(wN,h+225-correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        check.offset(wY,h+250-correction).click();
        check.offset(wN,h+250-correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        check.offset(wY,h+275-correction).click();
        check.offset(wN,h+275-correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
        check.offset(wY,h+300-correction-7).click();
        check.offset(wN,h+300-correction-7).click();

        clickRightSideOfElement(HW_SPECIAL_INSTRUCTIONS,0);
        pasteText("Some Special Instructions");

        return "success";
    }

    public String fillOutHwForm(HotWorkDto hw){
        try{
            Region location = screen.wait(HW_LOCATION, 2);
            location.offset(location.w / 2 - 5, 0).click();
            pasteText(hw.getLocation());
            screen.type(Key.TAB);
            pasteText(formatDate(hw.getDate()));
            screen.type(Key.TAB);
            pasteText(hw.getForeman());
            screen.type(Key.TAB);
            pasteText(hw.getFireWatch());

            Region model = screen.wait(HW_METER_MODEL, 2);
            model.offset(model.w / 2 - 5, 0).click();
            pasteText(hw.getMeterModel());
            screen.type(Key.TAB);
//            pasteText(hw.getMeterNum());
            screen.type(Key.TAB);
            pasteText(formatDate(hw.getDate()));

            clickRightSideOfElement(HW_FIRE_WATCH_REQUIRED, -2);
//
            Region check = screen.wait(HW_MEASURES_TAKEN_CKECKBOXES, 2);
            int wY = 5 - check.w / 2;
            int wN = check.w / 2 - 12;
            int h = 7 - check.h / 2;

            if (hw.getMeasures().isAreaIsClean()) check.offset(wY, h).click();
            else check.offset(wN, h).click();
            if (hw.getMeasures().isFlammablesAreSecured()) check.offset(wY, h + 25).click();
            else check.offset(wN, h + 25).click();
            if (hw.getMeasures().isNoCombustibleDustOrDebrisPresent()) check.offset(wY, h + 50).click();
            else check.offset(wN, h + 50).click();
            if (hw.getMeasures().isRadiativeHeatPreventiveMeasuresAreTaken()) check.offset(wY, h + 75).click();
            else check.offset(wN, h + 75).click();
            if (hw.getMeasures().isVesselsArePurged()) check.offset(wY, h + 100).click();
            else check.offset(wN, h + 100).click();

            int correction = 7;

            if (hw.getMeasures().isOpeningsAreCovered()) check.offset(wY, h + 150 - correction).click();
            else check.offset(wN, h + 150 - correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            if (hw.getMeasures().isDuctVentilationIsSecured()) check.offset(wY, h + 175 - correction).click();
            else check.offset(wN, h + 175 - correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            correction = 25;
            if (hw.getMeasures().isLockOutIsCompleted()) check.offset(wY, h + 200 - correction + 3).click();
            else check.offset(wN, h + 200 - correction + 3).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            if (hw.getMeasures().isCommunicationIsEstablished()) check.offset(wY, h + 225 - correction).click();
            else check.offset(wN, h + 225 - correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            if (hw.getMeasures().isFireWatchIsAwareOfDuties()) check.offset(wY, h + 250 - correction).click();
            else check.offset(wN, h + 250 - correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            if (hw.getMeasures().isFireExtinguisherPresent()) check.offset(wY, h + 275 - correction).click();
            else check.offset(wN, h + 275 - correction).click();
//        try{Thread.sleep(1000);}catch (Exception e){}
            if (hw.getMeasures().isFireProtectionIsInService()) check.offset(wY, h + 300 - correction - 7).click();
            else check.offset(wN, h + 300 - correction - 7).click();

            clickRightSideOfElement(HW_SPECIAL_INSTRUCTIONS, 0);
            pasteText(hw.getSpecialInstructions());

            return "Hot work form is successfully filled out";
        }catch (Exception e){
            return "Failed to fill out hot work form";
        }
    }

    public String saveHwForm(){
        try{
            clickSaveButton();
            String num = getPermitNumber();
            return num;
        }catch (Exception e){
            e.printStackTrace();
            logger.info("Failed saving hot work permit: " + e.getMessage());
            return "Failed saving hot work permit: " + e.getMessage();
        }
    }



    public String getPermitNumber() throws FindFailed {
        this.ungroupByStatus();
        pause(500);
        Region column = screen.wait(SW_PERMIT_NUMBER_COLUMN,5);
//        column.click();
        Region firstRow = new Region(column.x-10,column.y+20,column.w+10,column.h+1);
//        firstRow.click();
//        saveRegion(firstRow, "FirstRow.png");
        logger.info("First row has " + firstRow.h + " height");
        String number = firstRow.text();
        logger.info("Found permit number: " + number);
        if(number!=null)number = number.replaceAll("[^0-9]", "");
        if(number!=null && number.length()>5) number = number.substring(number.length()-5);
        logger.info("Processed number is: " + number);
        return number;
    }

    public String getFirstRowText() throws FindFailed {
        Region column = screen.wait(SW_PERMIT_NUMBER_COLUMN,2);
        Region firstRow = new Region(column.x-10,column.y+10,screen.w,column.h+10);
        System.out.println(firstRow.text());
        return "success";
    }

    public void clickFirstRow() throws FindFailed {
        Region column = screen.wait(SW_PERMIT_NUMBER_COLUMN,5);
        Region firstRow = new Region(column.x-10,column.y+20,column.w+10,column.h+1);
        firstRow.click();
    }


    public String searchByPermitNumber(String permitNumber) throws FindFailed {
        Region column = screen.wait(SW_PERMIT_NUMBER_COLUMN,5);
        searchByColumn(column,permitNumber).click();
        return "Success";
    }

    public Region searchByColumn(Region columnHeader, String value) throws FindFailed {
        Region column = new Region(columnHeader.x, columnHeader.y, columnHeader.w, screen.getBounds().height);
        int step = columnHeader.h;
        int currentY = columnHeader.y;
        int bottomY = column.y + column.h;

        while (currentY + step <= bottomY) {
            Region r = new Region(columnHeader.x, currentY, columnHeader.w, step);
            String text = r.text();
//            System.out.println("text = " + text);
            if (text != null && text.toLowerCase().contains(value.toLowerCase())) {
                return r;
            }
            currentY += step;
        }
        throw new RuntimeException("Value " + value + " wasn't found");
    }

    public void clickSaveButton() throws FindFailed {
        Region saveBtn = screen.wait(SW_SAVE_BUTTON, 5);
        saveBtn.click();
        int retries = 0;

        // Keep retrying while the error message persists
        while (screen.exists(ERROR_RECORD_IN_USE, 1) != null) {
            pause(300);
            screen.type(Key.ENTER); // dismiss error pop-up
            pause(300);
            saveBtn.click();
            retries++;
            if(retries>10) throw new RuntimeException("Failed to save permit");
        }

        System.out.println("Save button click successful — record no longer locked.");
    }





    public String groupByStatus() throws FindFailed {
        screen.wait(SW_STATUS_COLUMN);
        if(screen.exists(SW_DRAD_COLUMN,1)!=null){
            screen.dragDrop(SW_STATUS_COLUMN,SW_DRAD_COLUMN);
        }
        return "success";
    }

    public String ungroupByStatus() throws FindFailed {
        screen.wait(SW_STATUS_COLUMN_GROUPED);
        if(screen.exists(SW_DRAD_COLUMN,1)==null){
            Region permNum = screen.find(SW_PERMIT_NUMBER_COLUMN);
            permNum = new Region(permNum.x+permNum.w,permNum.y,permNum.w,permNum.h);
            screen.dragDrop(SW_STATUS_COLUMN_GROUPED,permNum);
        }
        return "success";
    }


    private boolean isProcessRunning(String processName) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder("tasklist.exe");
        Process process = processBuilder.start();
        String tasksList = new String(process.getInputStream().readAllBytes());
        return tasksList.contains(processName);
    }

    private boolean isLoggedIn() throws FindFailed {
        return screen.exists(NO_ONE_LOGGED_ID,2) == null;
    }

    private void maximizeWindow() throws FindFailed {
        Pattern iconInactive = new Pattern(BASE_PATH + "RetTagIconInTaskBarInactive.png");
        Pattern iconActive = new Pattern(BASE_PATH + "RetTagIconInTaskBarActive.png");

        try {
            // Check if the window is already maximized
            screen.find(iconActive);
            System.out.println("Window is already maximized.");
            screen.click(iconActive);
        } catch (FindFailed e) {
            // If minimize button is not found, the window is not maximized
            screen.click(iconInactive);
            System.out.println("Window maximized.");
        }

        if(screen.wait(RED_TAG_LOGO_IN_TITLE_BAR,1) ==null){
            screen.click(iconInactive);
        }
    }

    public static void maximizeWindowWindows(String windowTitle) {
        WinDef.HWND hwnd = User32.INSTANCE.FindWindow(null, windowTitle);
        if (hwnd != null) {
            User32.INSTANCE.ShowWindow(hwnd, 9); // 3 = SW_RESTORE
            User32.INSTANCE.SetForegroundWindow(hwnd);
            User32.INSTANCE.ShowWindow(hwnd, 3); // 3 = SW_MAXIMIZE
        } else {
            System.out.println("Window not found: " + windowTitle);
        }
    }


    public void findAndClickElement(Pattern pattern) throws FindFailed {
        Region element = screen.find(pattern);
        element.offset(element.w / 2 - 5, element.h / 2 - 5).click();
    }

    public void typeIntoField(Pattern fieldPattern, String text) throws FindFailed {
        Region field = screen.find(fieldPattern);
        field.offset(field.w - 5, field.h - 15).click();
        App.setClipboard(text);
        screen.type("v", KeyModifier.CTRL);
    }

    public void addNewDevice(LotoPointDto lotoPoint) throws FindFailed {
        findAndClickElement(ADD_DEVICE_MANUALLY_BTN);
        screen.wait(NEW_POINT_WINDOW, 10);
        appWindow = screen.find(NEW_POINT_WINDOW);

        typeIntoField(new Pattern(BASE_PATH + "deviceDescriptionField.png"), lotoPoint.getDescription());
        typeIntoField(new Pattern(BASE_PATH + "deviceTagField.png"), lotoPoint.getTagNumber());
        typeIntoField(new Pattern(BASE_PATH + "deviceLocationField.png"), lotoPoint.getSpecificLocation());
        typeIntoField(new Pattern(BASE_PATH + "isoPosField.png"), lotoPoint.getIsoPos().getName());
        typeIntoField(new Pattern(BASE_PATH + "normPosField.png"), lotoPoint.getNormPos().getName());

        handleLocableDropdown();
        findAndClickElement(OK_BTN);
    }

    private void handleLocableDropdown() throws FindFailed {
        Pattern locableDropdown = new Pattern(BASE_PATH + "locableDropdown.png");
        Region dropdown = appWindow.find(locableDropdown);
        dropdown.offset(dropdown.w - 5, dropdown.h / 2 - 5).click();
        dropdown.offset(dropdown.w - 5, dropdown.h + 5).click();
    }

    private void pasteText(String text){
        App.setClipboard(text);
        screen.type("v", KeyModifier.CTRL);
        System.out.println("Pasted: " + text);
    }

    /** Converts ISO date (2026-03-09) to US format (03/09/2026). Passes through if already in MM/dd/yyyy. */
    private String formatDate(String date) {
        if (date == null) return "";
        if (date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return LocalDate.parse(date).format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        }
        return date;
    }

    private void clickLeftSideOfElement(Pattern pattern, int offsetFromLeft) throws FindFailed {
        Region element = screen.find(pattern);
        element.offset(-element.w/2+offsetFromLeft,0).click();
    }
    private void clickRightSideOfElement(Pattern pattern, int offsetFromRight) throws FindFailed {
        Region element = screen.find(pattern);
        element.offset(element.w/2+offsetFromRight,0).click();
    }
    private void clickYesNo(Pattern pattern, boolean yes) throws FindFailed {
        if(yes) clickLeftSideOfElement(pattern,7);
        else clickLeftSideOfElement(pattern,40);
    }
    private void clickInactiveOrFirstRow(Region searchArea, Region columnHeader) {
        int step = columnHeader.h;
        int currentY = columnHeader.y + step;
        int bottomY = searchArea.y + searchArea.h;
        Region firstRow = null;

        while (currentY + step <= bottomY) {
            Region r = new Region(searchArea.x, currentY, searchArea.w, step);
            String text = r.text();
            if (text == null || text.trim().isEmpty()) break;
            if (firstRow == null) firstRow = r;
            if (text.toUpperCase().contains("INACTIVE")) {
                r.click();
                r.click();
                return;
            }
            currentY += step;
        }
        if (firstRow != null) {
            firstRow.click();
            firstRow.click();
        }
    }
    private void clickNoBelow(Pattern pattern) throws FindFailed {
        Region element = screen.find(pattern);
        element.offset(-element.w / 2 + 40, 25).click();
    }

    private void saveRegion(Region r, String name){
        String outputPath = "sikulix_captures/"+name;
        Image img = r.getImage(); // returns the captured image as a SikuliX Image object
        img.save(outputPath);

        System.out.println("Saved region screenshot to: " + outputPath);

    }


    public void testData(DailyPermitPackageDto dto) {
        System.out.println(dto.getSafeWorks().size() + " safe-works");
    }

    /********************************************************************************************************************
    RETRY METHODS
     *********************************************************************************************************************/
    private boolean retryClickAndReturnBoolean(Pattern pattern, int attempts) {
        for (int i = 0; i < attempts; i++) {
            try {
                screen.find(pattern).click();
                return true;
            } catch (FindFailed e) {
                pause(500);
            }
        }
        return false;
    }

    private void retryClickAndThrowException(Pattern pattern, int attempts) throws FindFailed {
        for (int i = 0; i < attempts; i++) {
            try {
                screen.find(pattern).click();
                return;
            } catch (FindFailed e) {
                pause(500);
            }
        }
        screen.find(pattern).click();
    }

    private void retryClickAndThrowException(Region region, Pattern pattern, int attempts) throws FindFailed {
        for (int i = 0; i < attempts; i++) {
            try {
                region.find(pattern).click();
                return;
            } catch (FindFailed e) {
                pause(500);
            }
        }
        region.find(pattern).click();
    }
}