package com.dk_power.power_plant_java.sevice.loto;

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



            Pattern searchMenu = new Pattern("LOTO pic/searchMenu.png");
            Pattern searchInput = new Pattern("LOTO pic/searchInputField.png");
            Pattern searchButton = new Pattern("LOTO pic/searchButton.png");
            Pattern selectItem = new Pattern("LOTO pic/selectItemField.png");
            Pattern clearButton = new Pattern("LOTO pic/clearButton.png");

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
                appWindow.click("LOTO pic/clearButton.png");
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }catch(FindFailed e){
            e.printStackTrace();
        }
    }
}
