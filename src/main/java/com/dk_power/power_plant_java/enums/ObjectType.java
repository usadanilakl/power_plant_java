package com.dk_power.power_plant_java.enums;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public enum ObjectType {
    FILE("files"),
    LOTO("LOTOs"),
    EQUIPMENT("Equipment"),
    LOTO_POINT("LotoPoints");
    private final String value;
    ObjectType(String value){
        this.value = value;
    }
    public String getValue(){
        return value;
    }
}

