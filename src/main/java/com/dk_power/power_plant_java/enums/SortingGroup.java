package com.dk_power.power_plant_java.enums;

import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public enum SortingGroup {
    PID_BY_VENDOR("P&IDs By Vendor"),
    PID_BY_SYSTEM("P&IDs By System"),
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
