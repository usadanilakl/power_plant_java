package com.dk_power.power_plant_java.sevice.automation;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
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

            // Wait for the application to start
            Thread.sleep(10000);  // Adjust this delay as needed
        } else {
            System.out.println("Application is already running.");
            maximizeWindow();
        }
    }

    public String login() throws FindFailed {
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
        App.setClipboard("a87168814B");
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
        Region mainMenu = screen.find(MAIN_MENU);
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

    private boolean isProcessRunning(String processName) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder("tasklist.exe");
        Process process = processBuilder.start();
        String tasksList = new String(process.getInputStream().readAllBytes());
        return tasksList.contains(processName);
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






}