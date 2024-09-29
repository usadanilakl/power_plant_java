package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import lombok.RequiredArgsConstructor;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.springframework.stereotype.Service;

import java.util.List;

//@Service
//@RequiredArgsConstructor
public class LotoBuilderService {
    public static void buildLoto(List<String> list){
        try {

            Screen scr = new Screen(0);
            scr.setAutoWaitTimeout(30);
            Settings.TypeDelay = 0;
            Settings.MoveMouseDelay = 0;



            Pattern searchMenu = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/searchMenu.png");
            Pattern searchInput = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/searchInputField.png");
            Pattern searchButton = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/searchButton.png");
            Pattern selectItem = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/selectItemField.png");
            Pattern clearButton = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/clearButton.png");

            Region appWindow = scr.find(searchMenu);
            appWindow = new Region(appWindow.x,appWindow.y,appWindow.w,appWindow.h+30);

            for (String s : list) {
                //scr.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/searchInputField.png",10);
                Region r = appWindow.find(searchInput);
                //scr.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/searchInputField.png",10);
                r.offset(r.w-5,0).click();

                // Copy the text to the clipboard
                App.setClipboard(s);

                // Simulate a paste operation
                scr.type("v", KeyModifier.CTRL);

                //appWindow.type(s);
                //appWindow.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/searchButton.png",10);
                Region r3 = appWindow.find(searchButton);
                //appWindow.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/searchButton.png",10);
                r3.click();
                //appWindow.findText(s).doubleClick();
                //appWindow.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/selectItemField.png",10);
                Region r2 = appWindow.find(selectItem);
                //appWindow.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/selectItemField.png",10);
//                r2.offset(0,r2.h/2).doubleClick();
                r2.doubleClick();
                //appWindow.wait("J:/Jackson Generation P&IDs/LOTO/LOTO pic/clearButton.png",10);
                appWindow.click("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/clearButton.png");
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }
    public static void buildLotowWithNewPoints(List<LotoPointDto> list){
        try {

            Screen scr = new Screen(0);
            scr.setAutoWaitTimeout(30);
            Settings.TypeDelay = 0;
            Settings.MoveMouseDelay = 0;



            Pattern pointMenuPattern = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/pointMenu.png");
            Pattern addDeviceManuallyBtn = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/addDeviceManuallyBtn.png");
            Pattern newPointWindow = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/newPointWindow.png");
            Pattern deviceDescriptionField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/deviceDescriptionField.png");
            Pattern deviceTagField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/deviceTagField.png");
            Pattern deviceLocationField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/deviceLocationField.png");
            Pattern deviceSystemField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/deviceSystemField.png");
            Pattern deviceTypeField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/deviceTypeField.png");
            Pattern isoPosField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/isoPosField.png");
            Pattern normPosField = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/normPosField.png");
            Pattern locableDropdown = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/locableDropdown.png");
            Pattern locableDropdownContent = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/locableDropdownContent.png");
            Pattern okBtn = new Pattern("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/okBtn.png");

            Region pointMenu = scr.find(pointMenuPattern);
            pointMenu = new Region(pointMenu.x,pointMenu.y,pointMenu.w,pointMenu.h);



            for (LotoPointDto lp : list) {
                Region r0 = pointMenu.find(addDeviceManuallyBtn);
                r0.offset(r0.w/2-5,r0.h/2-5).click();

                scr.wait("J:/Jackson Generation P&IDs/New LOTO Project/LOTO pic/newPointWindow.png",10);

                Region appWindow = scr.find(newPointWindow);
                appWindow = new Region(appWindow.x,appWindow.y,appWindow.w,appWindow.h);

                Region r = appWindow.find(deviceDescriptionField);
                r.offset(r.w-5,r.h-15).click();
                App.setClipboard(lp.getDescription());// Copy the text to the clipboard
                scr.type("v", KeyModifier.CTRL);// Simulate a paste operation

                Region r2 = appWindow.find(deviceTagField);
                r2.offset(r2.w-5,r2.h-15).click();
                App.setClipboard(lp.getTagNumber());
                scr.type("v", KeyModifier.CTRL);

                Region r22 = appWindow.find(deviceLocationField);
                r22.offset(r22.w-5,r22.h-15).click();
                App.setClipboard(lp.getSpecificLocation());
                scr.type("v", KeyModifier.CTRL);

                Region r3 = appWindow.find(isoPosField);
                r3.offset(r3.w-5,r3.h/2).click();
                App.setClipboard(lp.getIsoPos().getName());
                scr.type("v", KeyModifier.CTRL);

                Region r4 = appWindow.find(normPosField);
                r4.offset(r4.w-5,r4.h/2).click();
                App.setClipboard(lp.getNormPos().getName());
                scr.type("v", KeyModifier.CTRL);

                Region r5 = appWindow.find(locableDropdown);
                r5.offset(r5.w-5,r5.h/2-5).click();
                r5.offset(r5.w-5,r5.h+5).click();

//                Region r6 = appWindow.find(locableDropdownContent);
//                r6.offset(r6.w/2,r6.h-5).click();

                Region r7 = appWindow.find(okBtn);
                r7.offset(r7.w/2-5,r7.h/2-5).click();
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }
}
