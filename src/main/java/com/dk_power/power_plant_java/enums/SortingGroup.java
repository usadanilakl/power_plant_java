package com.dk_power.power_plant_java.enums;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public enum SortingGroup {
    VENDOR("P&IDs By Vendor"),
    SYSTEM("P&IDs By System"),
    HEATTRACE("Heat Trace"),
    ELECTRICAL("Electrical Breakers");
    private final String value;
    SortingGroup(String value){
        this.value = value;
    }
    public String getValue(){
        return value;
    }
    public static List<Map<String,String>> getValues(){
        List<Map<String,String>> values = new ArrayList<>();
        for (SortingGroup group : SortingGroup.values()) {
            Map<String,String> map = new HashMap<>();
            map.put("value",group.getValue());
            map.put("group","vendor");
            values.add(map);
        }
        return values;
    }
}

