package com.dk_power.power_plant_java.sevice.automation;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;

@Service
@Transactional
public class RedTagAutomationService {

    private static final String BASE_PATH = "J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/";
    private static final Pattern POINT_MENU = new Pattern(BASE_PATH + "pointMenu.png");
    private static final Pattern ADD_DEVICE_MANUALLY_BTN = new Pattern(BASE_PATH + "addDeviceManuallyBtn.png");
    private static final Pattern NEW_POINT_WINDOW = new Pattern(BASE_PATH + "newPointWindow.png");
    private static final Pattern OK_BTN = new Pattern(BASE_PATH + "okBtn.png");
    private static final Pattern LOTO_PROCEDURES_TAB = new Pattern(BASE_PATH + "lotoProceduresTab.png");
    private static final Pattern LOG_IN_BUTTON = new Pattern(BASE_PATH + "loginButton.png");
    private static final Pattern LOG_IN_INPUT_FIELD = new Pattern(BASE_PATH + "userNameInputField.png");
    private static final Pattern PASSWORD_INPUT_FIELD = new Pattern(BASE_PATH + "passwordInputField.png");
    private static final Pattern LOGIN_MENU = new Pattern(BASE_PATH + "loginMenu.png");
    private static final Pattern LOGIN_BUTTON_IN_LOGIN_MENU = new Pattern(BASE_PATH + "loginButtonInLoginMenu.png");
    private static final Pattern LOGOUT_BUTTON = new Pattern(BASE_PATH + "logoutButton.png");
    private static final Pattern FAILED_LOGIN_POPUP = new Pattern(BASE_PATH + "failedLoginPopup.png");
    private static final Pattern FAILED_LOGIN_POPUP_YES_BUTTON = new Pattern(BASE_PATH + "failedLoginPopupYesButton.png");
    private static final Pattern MAIN_MENU = new Pattern(BASE_PATH + "mainMenu.png");
    private static final Pattern TOOLBAR = new Pattern(BASE_PATH + "toolBar.png");
    private static final Pattern MAIN_MENU_NEW_ISO_BUTTON = new Pattern(BASE_PATH + "mainMenuNewIsoButton.png");
    private static final Pattern NEW_ISO_LOTO_TYPE_DROPDOWN = new Pattern(BASE_PATH + "newIsolationLotoTypeDropdown.png");
    private static final Pattern ISSUE_LOTO_WITH_NO_STANDARD_BUTTON = new Pattern(BASE_PATH + "issueLotoWithNoStandardButton.png");
    private static final Pattern LOTO_BUILDER_LOTO_TYPE_DROPDOWN = new Pattern(BASE_PATH + "lotoBuilderLotoTypeDropdown.png");
    private static final Pattern LOTO_BUILDER_EQUIPMENT_DESCRIPTION = new Pattern(BASE_PATH + "lotoBuilderEquipmentDescriptionField.png");
    private static final Pattern LOTO_BUILDER_EQUIPMENT_TAG_NUMBER = new Pattern(BASE_PATH + "lotoBuilderEquipmentTagNumber.png");
    private static final Pattern RED_TAG_LOGO_IN_TITLE_BAR = new Pattern(BASE_PATH + "redTagLogoInTitleBar.png");
    private static final Pattern LOTO_BUILDER_CONTINUE_BUTTON = new Pattern(BASE_PATH + "lotoBuilderContinueButton.png");
    private static final Pattern LOTO_BUILDER_INFORMATION_FORM = new Pattern(BASE_PATH + "lotoInformationForm.png");
    private static final Pattern INFORMATION_FORM_LOCK_BOX_DROPDOWN = new Pattern(BASE_PATH + "infoFormLockBoxDropdown.png");
    private static final Pattern NO_ONE_LOGGED_ID = new Pattern(BASE_PATH + "noOneLoggedIn.png");
    private static final Pattern LOTO_TAB = new Pattern(BASE_PATH + "lotoTab.png");
    private static final Pattern LOTO_REQUESTOR = new Pattern(BASE_PATH + "LOTO_REQUESTOR.png");
    private static final Pattern LOTO_REQUESTED_BY = new Pattern(BASE_PATH + "LOTO_REQUESTED_BY.png");
    private static final Pattern LOTO_WORK_SCOPE = new Pattern(BASE_PATH + "LOTO_WORK_SCOPE.png");
    private static final Pattern LOTO_MENU_OK_BUTTON = new Pattern(BASE_PATH + "LOTO_MENU_OK_BUTTON.png");

    private static final String SAFE_WORK_PATH = Paths.get(BASE_PATH+"safework").toString();
    private static final Pattern SAFEWORK_TAB = new Pattern(SAFE_WORK_PATH + "/safeWorkTab.png");
    private static final Pattern NEW_PERMIT_BUTTON = new Pattern(SAFE_WORK_PATH + "/newPermitButton.png");
    private static final Pattern ISSUE_WITH_NO_TEMPLATE_BUTTON = new Pattern(SAFE_WORK_PATH + "/issueWithNoTemplateButton.png");
    private static final Pattern SHRINK_BUTTON = new Pattern(SAFE_WORK_PATH + "/shrinkButton.png");
    private static final Pattern SW_DATE_ISSUED = new Pattern(SAFE_WORK_PATH + "/swDateIssued.png");
    private static final Pattern SW_LOCATION = new Pattern(SAFE_WORK_PATH + "/swLocation.png");
    private static final Pattern SW_HIGH_TEMP = new Pattern(SAFE_WORK_PATH + "/swHighTemp.png");
    private static final Pattern SW_HIGH_PRESSURE = new Pattern(SAFE_WORK_PATH + "/swHighPressure.png");
    private static final Pattern SW_ENERGIZED = new Pattern(SAFE_WORK_PATH + "/swEnergized.png");
    private static final Pattern SW_STORED_ENERGY = new Pattern(SAFE_WORK_PATH + "/swStoredEnergy.png");
    private static final Pattern SW_EYE_HAZARD = new Pattern(SAFE_WORK_PATH + "/swEyeHazard.png");
    private static final Pattern SW_EGRESS_ACCESS = new Pattern(SAFE_WORK_PATH + "/SW_EGRESS_ACCESS.png");
    private static final Pattern SW_ERGONOMIC_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_ERGONOMIC_HAZARD.png");
    private static final Pattern SW_FALLING_OBJECT = new Pattern(SAFE_WORK_PATH + "/SW_FALLING_OBJECT.png");
    private static final Pattern SW_HIGH_NOISE = new Pattern(SAFE_WORK_PATH + "/SW_HIGH_NOISE.png");
    private static final Pattern SW_DUST_PARTICULATE = new Pattern(SAFE_WORK_PATH + "/SW_DUST_PARTICULATE.png");
    private static final Pattern SW_COMBUSTABLE_DUST = new Pattern(SAFE_WORK_PATH + "/SW_COMBUSTABLE_DUST.png");
    private static final Pattern SW_FIRE_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_FIRE_HAZARD.png");
    private static final Pattern SW_HOT_SURFACE = new Pattern(SAFE_WORK_PATH + "/SW_HOT_SURFACE.png");
    private static final Pattern SW_SLIPPERY = new Pattern(SAFE_WORK_PATH + "/SW_SLIPPERY.png");
    private static final Pattern SW_VENTILATION_REQUIRED = new Pattern(SAFE_WORK_PATH + "/SW_VENTILATION_REQUIRED.png");
    private static final Pattern SW_LIGHTING_RESTRICTIONS = new Pattern(SAFE_WORK_PATH + "/SW_LIGHTING_RESTRICTIONS.png");
    private static final Pattern SW_CHEMICAL_EXPOSURE = new Pattern(SAFE_WORK_PATH + "/SW_CHEMICAL_EXPOSURE.png");
    private static final Pattern SW_LIFTING_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_LIFTING_HAZARD.png");
    private static final Pattern SW_HAND_TRAPS = new Pattern(SAFE_WORK_PATH + "/SW_HAND_TRAPS.png");
    private static final Pattern SW_HEAT_COLD_STRESS = new Pattern(SAFE_WORK_PATH + "/SW_HEAT_COLD_STRESS.png");
    private static final Pattern SW_ELEVATED_SURFACE = new Pattern(SAFE_WORK_PATH + "/SW_ELEVATED_SURFACE.png");
    private static final Pattern SW_ENVIRONMENTAL = new Pattern(SAFE_WORK_PATH + "/SW_ENVIRONMENTAL.png");

    private static final Pattern SW_LOTO_REQUIRED = new Pattern(SAFE_WORK_PATH + "/SW_LOTO_REQUIRED.png");
    private static final Pattern SW_CONFINED_SPACE = new Pattern(SAFE_WORK_PATH + "/SW_CONFINED_SPACE.png");
    private static final Pattern SW_HOT_WORK = new Pattern(SAFE_WORK_PATH + "/SW_HOT_WORK.png");
    private static final Pattern SW_VENTING_PURGING = new Pattern(SAFE_WORK_PATH + "/SW_VENTING_PURGING.png");
    private static final Pattern SW_JHA = new Pattern(SAFE_WORK_PATH + "/SW_JHA.png");
    private static final Pattern SW_GAS_TESTING = new Pattern(SAFE_WORK_PATH + "/SW_GAS_TESTING.png");
    private static final Pattern SW_EXCAVATION_PERMIT = new Pattern(SAFE_WORK_PATH + "/SW_EXCAVATION_PERMIT.png");
    private static final Pattern SW_ENERGIZED_PERMIT = new Pattern(SAFE_WORK_PATH + "/SW_ENERGIZED_PERMIT.png");
    private static final Pattern SW_HARDHAT = new Pattern(SAFE_WORK_PATH + "/SW_HARDHAT.png");
    private static final Pattern SW_SAFETY_GLASSES = new Pattern(SAFE_WORK_PATH + "/SW_SAFETY_GLASSES.png");
    private static final Pattern SW_HEARING_PROTECTION = new Pattern(SAFE_WORK_PATH + "/SW_HEARING_PROTECTION.png");
    private static final Pattern SW_BOOTS = new Pattern(SAFE_WORK_PATH + "/SW_BOOTS.png");
    private static final Pattern SW_FALL_PROTECTION = new Pattern(SAFE_WORK_PATH + "/SW_FALL_PROTECTION.png");
    private static final Pattern SW_GFI = new Pattern(SAFE_WORK_PATH + "/SW_GFI.png");
    private static final Pattern SW_RESPIRATOR = new Pattern(SAFE_WORK_PATH + "/SW_RESPIRATOR.png");
    private static final Pattern SW_DUST_MASK = new Pattern(SAFE_WORK_PATH + "/SW_DUST_MASK.png");
    private static final Pattern SW_GLOVES = new Pattern(SAFE_WORK_PATH + "/SW_GLOVES.png");
    private static final Pattern SW_ICE_CLEATS = new Pattern(SAFE_WORK_PATH + "/SW_ICE_CLEATS.png");
    private static final Pattern SW_ACID_SUIT = new Pattern(SAFE_WORK_PATH + "/SW_ACID_SUIT.png");
    private static final Pattern SW_BARRICADE = new Pattern(SAFE_WORK_PATH + "/SW_BARRICADE.png");
    private static final Pattern SW_FACE_SHIELD = new Pattern(SAFE_WORK_PATH + "/SW_FACE_SHIELD.png");
    private static final Pattern SW_GAS_MONITOR = new Pattern(SAFE_WORK_PATH + "/SW_GAS_MONITOR.png");
    private static final Pattern SW_ARC_FLASH_PPE = new Pattern(SAFE_WORK_PATH + "/SW_ARC_FLASH_PPE.png");
    private static final Pattern SW_WELDING_JACKET = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_JACKET.png");
    private static final Pattern SW_WELDING_SHIELD = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_SHIELD.png");
    private static final Pattern SW_WELDING_GLOVES = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_GLOVES.png");
    private static final Pattern SW_PURGIN_VENTILATION = new Pattern(SAFE_WORK_PATH + "/SW_PURGIN_VENTILATION.png");
    private static final Pattern SW_SPECIAL_INSTRUCTIONS = new Pattern(SAFE_WORK_PATH + "/SW_SPECIAL_INSTRUCTIONS.png");
    private static final Pattern SW_REQUESTOR = new Pattern(SAFE_WORK_PATH + "/SW_REQUESTOR.png");
    private static final Pattern SW_SAVE_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_SAVE_BUTTON.png");


    private static final String CS_PATH = Paths.get(BASE_PATH+"confined-space").toString();
    private static final Pattern CS_TAB = new Pattern(CS_PATH + "/CS_TAB.png");
    private static final Pattern CS_SPACE = new Pattern(CS_PATH + "/CS_SPACE.png");
    private static final Pattern CS_PURPOSE = new Pattern(CS_PATH + "/CS_PURPOSE.png");
    private static final Pattern CS_ISSUED_TO = new Pattern(CS_PATH + "/CS_ISSUED_TO.png");
    private static final Pattern CS_ENTRY_DATE = new Pattern(CS_PATH + "/CS_ENTRY_DATE.png");
    private static final Pattern CS_START_TIME = new Pattern(CS_PATH + "/CS_START_TIME.png");
    private static final Pattern CS_DURATION = new Pattern(CS_PATH + "/CS_DURATION.png");
    private static final Pattern CS_OXIGEN_DEFF = new Pattern(CS_PATH + "/CS_OXIGEN_DEFF.png");
    private static final Pattern CS_FLAMEBLE_GAS = new Pattern(CS_PATH + "/CS_FLAMEBLE_GAS.png");
    private static final Pattern CS_COMBUSTIBLE_DUST = new Pattern(CS_PATH + "/CS_COMBUSTIBLE_DUST.png");
    private static final Pattern CS_TOXIC_GAS = new Pattern(CS_PATH + "/CS_TOXIC_GAS.png");
    private static final Pattern CS_ROTATING_EQ = new Pattern(CS_PATH + "/CS_ROTATING_EQ.png");
    private static final Pattern CS_ELECTRICAL_SHOCK = new Pattern(CS_PATH + "/CS_ELECTRICAL_SHOCK.png");
    private static final Pattern CS_ENTRAPMENT = new Pattern(CS_PATH + "/CS_ENTRAPMENT.png");



    private Screen screen;
    private Region appWindow;

    public RedTagAutomationService() {
        screen = new Screen(0);
        screen.setAutoWaitTimeout(30);
        Settings.TypeDelay = 0;
        Settings.MoveMouseDelay = 0;
    }

    public void openApp() throws IOException, InterruptedException, FindFailed {
        String appName = "Redtag.exe";
        String appPath = "J://RedTag/Redtag.exe";


        if (!isProcessRunning(appName)) {
            System.out.println("Starting " + appName + "...");
            Runtime.getRuntime().exec(appPath);

            if(isLoggedIn()) return;

            screen.wait(LOG_IN_BUTTON,60);
        } else {
            System.out.println("Application is already running.");
            maximizeWindowWindows("Redtag Enterprise");
        }
    }

    public String login() throws FindFailed {

        if(isLoggedIn()) return "Alredy Logged In";

        this.findAndClickElement(LOG_IN_BUTTON);
        Region loginMenu = screen.wait(LOGIN_MENU,5);
        loginMenu = new Region(loginMenu.x,loginMenu.y,loginMenu.w,loginMenu.h);

//        try{
//            Thread.sleep(1000);
//        }catch (Exception e){
//
//        }

        Region inp1 = loginMenu.find(LOG_IN_INPUT_FIELD);
        inp1.offset(inp1.w/2, inp1.h/2).click();
        App.setClipboard(System.getProperty("user.name"));
        screen.type("v", KeyModifier.CTRL);

//        try{
//            Thread.sleep(1000);
//        }catch (Exception e){
//
//        }

        Region inp2 = loginMenu.find(PASSWORD_INPUT_FIELD);
        inp2.offset(inp2.w/2-20, inp2.h/2-10).click();
        App.setClipboard("redtag");
        screen.type("v", KeyModifier.CTRL);

//        try{
//            Thread.sleep(1000);
//        }catch (Exception e){
//
//        }

        Region btn = loginMenu.find(LOGIN_BUTTON_IN_LOGIN_MENU);
        btn.offset(btn.w/2-20, btn.h/2-20).click();
//        screen.type(Key.ENTER);

        if(screen.exists(FAILED_LOGIN_POPUP,1)!=null){
            Region popup = screen.find(FAILED_LOGIN_POPUP);
            popup = new Region(popup.x,popup.y,popup.w,popup.h);
            popup.find(FAILED_LOGIN_POPUP_YES_BUTTON).click();

            Region loginMenu2 = screen.wait(LOGIN_MENU,5);
            loginMenu2 = new Region(loginMenu.x,loginMenu.y,loginMenu.w,loginMenu.h);

            Region inp11 = loginMenu2.find(LOG_IN_INPUT_FIELD);
            inp1.offset(inp11.w/2, inp11.h/2).click();
            App.setClipboard("automation");
            screen.type("v", KeyModifier.CTRL);

            Region inp22 = loginMenu2.find(PASSWORD_INPUT_FIELD);
            inp2.offset(inp22.w/2-20, inp22.h/2-10).click();
            App.setClipboard("redtag");
            screen.type("v", KeyModifier.CTRL);
            screen.type(Key.ENTER);
            screen.type(Key.ENTER);
            if(screen.exists(MAIN_MENU)!=null){
                return "Success";
            }
        }

        return "Fail";
    }



    public String openNewLotoBuilder() throws FindFailed {
        screen.find(LOTO_TAB).click();
        Region mainMenu = screen.wait(MAIN_MENU,2);
        mainMenu = new Region(mainMenu.x,mainMenu.y,mainMenu.w,mainMenu.h);

        Region newLotoBtn = mainMenu.find(MAIN_MENU_NEW_ISO_BUTTON);
        newLotoBtn.click();
        screen.wait(NEW_ISO_LOTO_TYPE_DROPDOWN,1).click();

        if(screen.exists(ISSUE_LOTO_WITH_NO_STANDARD_BUTTON,5)!=null)return "Scucess";
        else return "Failed";

    }

    public String openLotoBuilderWithNoStandard() throws FindFailed {
        screen.find(ISSUE_LOTO_WITH_NO_STANDARD_BUTTON).click();

        Region dropdown = screen.wait(LOTO_BUILDER_LOTO_TYPE_DROPDOWN,5);
        App.setClipboard("WORK SCOPE");
        screen.type("v", KeyModifier.CTRL);
        dropdown.offset(100,0).click();
        App.setClipboard("LOTO");
        screen.type("v", KeyModifier.CTRL);
//        try{
//            Thread.sleep(1000);
//        }catch (Exception e){
//
//        }

        Region eqDescr = screen.find(LOTO_BUILDER_EQUIPMENT_DESCRIPTION);
        eqDescr.offset(100,0).click();
        App.setClipboard("SOME EQUIPMENT DESCRIPTION");
        screen.type("v", KeyModifier.CTRL);
//        try{
//            Thread.sleep(1000);
//        }catch (Exception e){
//
//        }

        Region eqTag = screen.find(LOTO_BUILDER_EQUIPMENT_TAG_NUMBER);
        eqTag.offset(100,0).click();
        App.setClipboard("SOME EQUIPMENT TAG");
        screen.type("v", KeyModifier.CTRL);


        return "Success";

    }

    public String buildWithNewPoints(List<LotoPointDto> points){
        LotoBuilderService.buildLotowWithNewPoints(points);
        return "Success";
    }

    public String completeLotoBuilding() throws FindFailed {
        screen.find(LOTO_BUILDER_CONTINUE_BUTTON).click();
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




    public String openNewSafeWorkBuilder() throws FindFailed {
        screen.find(SAFEWORK_TAB).click();
        screen.wait(NEW_PERMIT_BUTTON,1).click();
        screen.wait(ISSUE_WITH_NO_TEMPLATE_BUTTON,3).click();
        Region shrink = screen.wait(SHRINK_BUTTON,10);
        shrink.click();
        shrink.click();
        shrink.click();
        return "Success";
    }

    public String fillOutSafeWorkForm() throws FindFailed {
        Region dateIssued = screen.wait(SW_DATE_ISSUED,1);
        dateIssued.offset(0,15).click();
        pasteText("09/07/2025");
        screen.type(Key.TAB);
        pasteText("0700");
        screen.type(Key.TAB);
        pasteText("Kiewit/Mike Miles");

        Region location = screen.find(SW_LOCATION);
        location.offset(250,0).click();
        pasteText("HRSG U2");

        location.offset(250,20).click();
        pasteText("Repairs");

        clickLeftSideOfElement(SW_HIGH_TEMP,2);

        Region hiPressure = screen.find(SW_HIGH_PRESSURE);
        hiPressure.offset(-hiPressure.w/2-15,0).click();

        clickLeftSideOfElement(SW_ENERGIZED,2);
        clickLeftSideOfElement(SW_STORED_ENERGY,2);
        clickLeftSideOfElement(SW_EYE_HAZARD,2);
        clickLeftSideOfElement(SW_EGRESS_ACCESS,2);
        clickLeftSideOfElement(SW_ERGONOMIC_HAZARD,2);
        clickLeftSideOfElement(SW_FALLING_OBJECT,2);
        clickLeftSideOfElement(SW_HIGH_NOISE,2);
        clickLeftSideOfElement(SW_DUST_PARTICULATE,2);
        clickLeftSideOfElement(SW_COMBUSTABLE_DUST,2);
        clickLeftSideOfElement(SW_FIRE_HAZARD,2);
        clickLeftSideOfElement(SW_HOT_SURFACE,2);
        clickLeftSideOfElement(SW_SLIPPERY,2);
        clickLeftSideOfElement(SW_VENTILATION_REQUIRED,2);
        clickLeftSideOfElement(SW_LIGHTING_RESTRICTIONS,2);
        clickLeftSideOfElement(SW_CHEMICAL_EXPOSURE,2);
        clickLeftSideOfElement(SW_LIFTING_HAZARD,2);
        clickLeftSideOfElement(SW_HAND_TRAPS,2);
        clickLeftSideOfElement(SW_HEAT_COLD_STRESS,2);
        clickLeftSideOfElement(SW_ELEVATED_SURFACE,2);
        clickLeftSideOfElement(SW_ENVIRONMENTAL,2);

        clickYesNo(SW_LOTO_REQUIRED,true);
        clickYesNo(SW_CONFINED_SPACE,true);
        clickYesNo(SW_HOT_WORK,true);
        clickYesNo(SW_VENTING_PURGING,true);
        clickYesNo(SW_JHA,true);
        clickYesNo(SW_GAS_TESTING,true);
        clickYesNo(SW_EXCAVATION_PERMIT,true);
        clickYesNo(SW_ENERGIZED_PERMIT,true);
        clickYesNo(SW_HARDHAT,true);
        clickYesNo(SW_SAFETY_GLASSES,true);
        clickYesNo(SW_HEARING_PROTECTION,true);
        clickYesNo(SW_BOOTS,true);
        clickYesNo(SW_FALL_PROTECTION,true);
        clickYesNo(SW_GFI,true);
        clickYesNo(SW_RESPIRATOR,true);
        clickYesNo(SW_DUST_MASK,true);
        clickYesNo(SW_GLOVES,true);
        clickYesNo(SW_ICE_CLEATS,true);
        clickYesNo(SW_ACID_SUIT,true);
        clickYesNo(SW_BARRICADE,true);
        clickYesNo(SW_FACE_SHIELD,true);
        clickYesNo(SW_GAS_MONITOR,true);
        clickYesNo(SW_ARC_FLASH_PPE,true);
        clickYesNo(SW_WELDING_JACKET,true);
        clickYesNo(SW_WELDING_SHIELD,true);
        clickYesNo(SW_WELDING_GLOVES,true);
        clickYesNo(SW_PURGIN_VENTILATION,true);

        clickYesNo(SW_LOTO_REQUIRED,false);
        clickYesNo(SW_CONFINED_SPACE,false);
        clickYesNo(SW_HOT_WORK,false);
        clickYesNo(SW_VENTING_PURGING,false);
        clickYesNo(SW_JHA,false);
        clickYesNo(SW_GAS_TESTING,false);
        clickYesNo(SW_EXCAVATION_PERMIT,false);
        clickYesNo(SW_ENERGIZED_PERMIT,false);
        clickYesNo(SW_HARDHAT,false);
        clickYesNo(SW_SAFETY_GLASSES,false);
        clickYesNo(SW_HEARING_PROTECTION,false);
        clickYesNo(SW_BOOTS,false);
        clickYesNo(SW_FALL_PROTECTION,false);
        clickYesNo(SW_GFI,false);
        clickYesNo(SW_RESPIRATOR,false);
        clickYesNo(SW_DUST_MASK,false);
        clickYesNo(SW_GLOVES,false);
        clickYesNo(SW_ICE_CLEATS,false);
        clickYesNo(SW_ACID_SUIT,false);
        clickYesNo(SW_BARRICADE,false);
        clickYesNo(SW_FACE_SHIELD,false);
        clickYesNo(SW_GAS_MONITOR,false);
        clickYesNo(SW_ARC_FLASH_PPE,false);
        clickYesNo(SW_WELDING_JACKET,false);
        clickYesNo(SW_WELDING_SHIELD,false);
        clickYesNo(SW_WELDING_GLOVES,false);
        clickYesNo(SW_PURGIN_VENTILATION,false);

        screen.find(SW_SPECIAL_INSTRUCTIONS).offset(0,15).click();
        pasteText("Special instructions are here");
        screen.find(SW_REQUESTOR).offset(0,15).click();
        pasteText("Adam Bunker");

        return "success";
    }

    public String saveSafeWork() throws FindFailed {
        screen.find(SW_SAVE_BUTTON).hover();
        return "success";
    }



    public String openNewConfinedSpaceBuilder() throws FindFailed{
        screen.find(CS_TAB).click();
        screen.wait(NEW_PERMIT_BUTTON,1).click();
        screen.wait(ISSUE_WITH_NO_TEMPLATE_BUTTON,3).click();
        Region shrink = screen.wait(SHRINK_BUTTON,10);
        shrink.click();
        shrink.click();
        shrink.click();
        return "Success";
    }

    public String fillOutCSForm() throws FindFailed{
        return "success";
    }

    public String saveCsForm() throws FindFailed{
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
    }

    private void clickLeftSideOfElement(Pattern pattern, int offsetFromLeft) throws FindFailed {
        Region element = screen.find(pattern);
        element.offset(-element.w/2+offsetFromLeft,0).click();
    }
    private void clickYesNo(Pattern pattern, boolean yes) throws FindFailed {
        if(yes) clickLeftSideOfElement(pattern,7);
        else clickLeftSideOfElement(pattern,40);
    }






}