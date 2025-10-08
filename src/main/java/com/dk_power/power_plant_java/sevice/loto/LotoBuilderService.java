package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import lombok.RequiredArgsConstructor;
import org.sikuli.basics.Settings;
import org.sikuli.script.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

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



            Pattern pointMenuPattern = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/pointMenu.png");
            Pattern addDeviceManuallyBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/addDeviceManuallyBtn.png");
            Pattern newPointWindow = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png");
            Pattern deviceDescriptionField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceDescriptionField.png");
            Pattern deviceTagField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTagField.png");
            Pattern deviceLocationField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceLocationField.png");
//            Pattern deviceSystemField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceSystemField.png");
//            Pattern deviceTypeField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTypeField.png");
            Pattern isoPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/isoPosField.png");
            Pattern normPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/normPosField.png");
            Pattern locableDropdown = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdown.png");
//            Pattern locableDropdownContent = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdownContent.png");
            Pattern okBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/okBtn.png");
            Pattern zeroEnergy = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/largeDescription.png");
            Pattern note = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceNote.png");

            Region pointMenu = scr.find(pointMenuPattern);
            pointMenu = new Region(pointMenu.x,pointMenu.y,pointMenu.w,pointMenu.h);



            for (LotoPointDto lp : list) {
                System.out.println(lp.getDescription() + " " + lp.getTagNumber() + " " + lp.getSpecificLocation() + " " + lp.getIsolatedPosition());
                Region r0 = pointMenu.find(addDeviceManuallyBtn);
                r0.offset(r0.w/2-5,r0.h/2-5).click();

                scr.wait("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png",10);

                Region appWindow = scr.find(newPointWindow);
                appWindow = new Region(appWindow.x,appWindow.y,appWindow.w,appWindow.h);

                Region r = appWindow.find(deviceDescriptionField);
                r.offset(r.w-5,r.h-15).click();
                App.setClipboard(lp.getDescription());
                scr.type("v", KeyModifier.CTRL);

                Region zeroEnergyRegion = appWindow.find(zeroEnergy);
                zeroEnergyRegion.offset(r.w-5,r.h/2).click();
                App.setClipboard("Some instructions");
                scr.type("v", KeyModifier.CTRL);

                Region r2 = appWindow.find(deviceTagField);
                r2.offset(r2.w-5,r2.h-15).click();
                App.setClipboard(lp.getTagNumber());
                scr.type("v", KeyModifier.CTRL);

                Region r22 = appWindow.find(deviceLocationField);
                r22.offset(r22.w-5,r22.h-15).click();
                App.setClipboard(lp.getSpecificLocation());
                scr.type("v", KeyModifier.CTRL);

                String normalPosition = lp.getNormPos()!=null? lp.getNormPos().getName() : lp.getNormalPosition();
                String isolatedPosition = lp.getIsoPos()!=null? lp.getIsoPos().getName() : lp.getIsolatedPosition();

                Region r3 = appWindow.find(isoPosField);
                r3.offset(r3.w-50,r3.h/2).click();
                App.setClipboard(isolatedPosition);
                scr.type("v", KeyModifier.CTRL);

                Region r4 = appWindow.find(normPosField);
                r4.offset(r4.w/2,r4.h/2-2).click();
                r4.offset(r4.w/2,r4.h/2-2).click();
                App.setClipboard(normalPosition);
                scr.type("v", KeyModifier.CTRL);

                Region r5 = appWindow.find(locableDropdown);
                r5.offset(r5.w-20,r5.h/2-5).click();
                r5.offset(r5.w-20,r5.h+10).click();

                Region noteRegion = appWindow.find(note);
                noteRegion.offset(r4.w/2,r4.h/2).click();
                App.setClipboard("Some note");
                scr.type("v", KeyModifier.CTRL);

//                Region r6 = appWindow.find(locableDropdownContent);
//                r6.offset(r6.w/2,r6.h-5).click();

                Region r7 = appWindow.find(okBtn);
                r7.offset(r7.w/2,r7.h/2).click();


            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }

    public static void buildLotowWithNewPoints(Set<LotoPointIdDto> list){

    }

    public static void buildRedTagLoto(List<BrLotoPoint> list){
        try {

            Screen scr = new Screen(0);
            scr.setAutoWaitTimeout(30);
            Settings.TypeDelay = 0;
            Settings.MoveMouseDelay = 0;



            Pattern pointMenuPattern = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/pointMenu.png");
            Pattern addDeviceManuallyBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/addDeviceManuallyBtn.png");
            Pattern newPointWindow = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png");
            Pattern deviceDescriptionField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceDescriptionField.png");
            Pattern deviceTagField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTagField.png");
            Pattern deviceLocationField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceLocationField.png");
//            Pattern deviceSystemField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceSystemField.png");
//            Pattern deviceTypeField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTypeField.png");
            Pattern isoPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/isoPosField.png");
            Pattern normPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/normPosField.png");
            Pattern locableDropdown = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdown.png");
//            Pattern locableDropdownContent = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdownContent.png");
            Pattern okBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/okBtn.png");
            Pattern zeroEnergy = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/largeDescription.png");
            Pattern note = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceNote.png");

            Region pointMenu = scr.find(pointMenuPattern);
            pointMenu = new Region(pointMenu.x,pointMenu.y,pointMenu.w,pointMenu.h);



            for (BrLotoPoint lp : list) {
                System.out.println(lp.getDescription() + " " + lp.getTagNumber() + " " + lp.getSpecificLocation() + " " + lp.getIsolatedPosition());
                Region r0 = pointMenu.find(addDeviceManuallyBtn);
                r0.offset(r0.w/2-5,r0.h/2-5).click();

                scr.wait("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png",10);

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
                r3.offset(r3.w-50,r3.h/2).click();
                App.setClipboard(lp.getIsolatedPosition());
                scr.type("v", KeyModifier.CTRL);

                Region r4 = appWindow.find(normPosField);
                r4.offset(r4.w/2,r4.h/2-2).click();
                r4.offset(r4.w/2,r4.h/2-2).click();
                App.setClipboard(lp.getNormalPosition());
                scr.type("v", KeyModifier.CTRL);

                Region r5 = appWindow.find(locableDropdown);
                r5.offset(r5.w-20,r5.h/2-5).click();
                r5.offset(r5.w-20,r5.h+10).click();

//                Region r6 = appWindow.find(locableDropdownContent);
//                r6.offset(r6.w/2,r6.h-5).click();

                Region r7 = appWindow.find(okBtn);
                r7.offset(r7.w/2,r7.h/2).click();
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }

    public static void addPointToRedTag(List<LotoPoint> list){
        try {

            Screen scr = new Screen(0);
            scr.setAutoWaitTimeout(30);
            Settings.TypeDelay = 0;
            Settings.MoveMouseDelay = 0;



            Pattern pointMenuPattern = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/pointMenu.png");
            Pattern addDeviceManuallyBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/addDeviceManuallyBtn.png");
            Pattern newPointWindow = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png");
            Pattern deviceDescriptionField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceDescriptionField.png");
            Pattern deviceTagField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTagField.png");
            Pattern deviceLocationField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceLocationField.png");
//            Pattern deviceSystemField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceSystemField.png");
//            Pattern deviceTypeField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceTypeField.png");
            Pattern isoPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/isoPosField.png");
            Pattern normPosField = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/normPosField.png");
            Pattern locableDropdown = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdown.png");
//            Pattern locableDropdownContent = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/locableDropdownContent.png");
            Pattern okBtn = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/okBtn.png");
            Pattern zeroEnergy = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/largeDescription.png");
            Pattern note = new Pattern("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/deviceNote.png");

            Region pointMenu = scr.find(pointMenuPattern);
            pointMenu = new Region(pointMenu.x,pointMenu.y,pointMenu.w,pointMenu.h);



            for (LotoPoint lp : list) {
                System.out.println(lp.getDescription() + " " + lp.getTagNumber() + " " + lp.getSpecificLocation() + " " + lp.getIsolatedPosition());
                Region r0 = pointMenu.find(addDeviceManuallyBtn);
                r0.offset(r0.w/2-5,r0.h/2-5).click();

                scr.wait("J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/newPointWindow.png",10);

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
                r3.offset(r3.w-50,r3.h/2).click();
                App.setClipboard(lp.getIsolatedPosition());
                scr.type("v", KeyModifier.CTRL);

                Region r4 = appWindow.find(normPosField);
                r4.offset(r4.w/2,r4.h/2-2).click();
                r4.offset(r4.w/2,r4.h/2-2).click();
                App.setClipboard(lp.getNormalPosition());
                scr.type("v", KeyModifier.CTRL);

                Region r5 = appWindow.find(locableDropdown);
                r5.offset(r5.w-20,r5.h/2-5).click();
                r5.offset(r5.w-20,r5.h+10).click();

//                Region r6 = appWindow.find(locableDropdownContent);
//                r6.offset(r6.w/2,r6.h-5).click();

                Region r7 = appWindow.find(okBtn);
                r7.offset(r7.w/2,r7.h/2).click();
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }
}
