package com.dk_power.power_plant_java.controller.permits.automation;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
@Service
public class RedTagAutomationService {

    private static final String BASE_PATH = "J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/";
    private static final Pattern POINT_MENU = new Pattern(BASE_PATH + "pointMenu.png");
    private static final Pattern ADD_DEVICE_MANUALLY_BTN = new Pattern(BASE_PATH + "addDeviceManuallyBtn.png");
    private static final Pattern NEW_POINT_WINDOW = new Pattern(BASE_PATH + "newPointWindow.png");
    private static final Pattern OK_BTN = new Pattern(BASE_PATH + "okBtn.png");
    private static final Pattern LOTO_PROCEDURES_TAB = new Pattern(BASE_PATH + "lotoProceduresTab.png");
    private static final Pattern LOG_IN_BUTTON = new Pattern(BASE_PATH + "loginButton.png");
    private static final Pattern LOG_IN_INPUT_FIELD = new Pattern(BASE_PATH + "userNameInputField.png");
    private static final Pattern PASSWORD_INPUT_FIELD = new Pattern(BASE_PATH + "passwordInputField.png");

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
        Region element = appWindow.find(pattern);
        element.offset(element.w/2-5, element.h/2-5).click();
    }

    public void typeIntoField(Pattern fieldPattern, String text) throws FindFailed {
        Region field = appWindow.find(fieldPattern);
        field.offset(field.w-5, field.h-15).click();
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
        dropdown.offset(dropdown.w-5, dropdown.h/2-5).click();
        dropdown.offset(dropdown.w-5, dropdown.h+5).click();
    }


}