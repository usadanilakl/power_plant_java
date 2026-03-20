package com.dk_power.power_plant_java.enums;

public final class PermissionLevel {
    public static final String NONE = "NONE";
    public static final String BASIC = "BASIC";
    public static final String OPERATOR = "OPERATOR";

    private PermissionLevel() {}

    public static boolean canViewPermits(String level) {
        return BASIC.equals(level) || OPERATOR.equals(level);
    }

    public static boolean canSignPermits(String level) {
        return OPERATOR.equals(level);
    }
}
