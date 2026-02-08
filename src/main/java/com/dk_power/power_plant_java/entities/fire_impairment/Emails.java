package com.dk_power.power_plant_java.entities.fire_impairment;

public enum Emails {
    ADAM("Adam", "abunker@jpowerusa.com"),
    ANDREW_G("Andrew G", "agorelik@jpowerusa.com"),
    ANDREW_S("Andrew S", "astroud@jpowerusa.com"),
    ANTHONY("Anthony", "astein-rojas@jpowerusa.com"),
    AUSTIN("Austin", "aouellette@jpowerusa.com"),
    DANIL("Danil", "dklokov@jpowerusa.com"),
    EUGENE("Eugene", "emykhailenko@jpowerusa.com"),
    GEO("Geo", "gmartinez@jpowerusa.com"),
    HEATHER("Heather", "hsincak@jpowerusa.com"),
    JOHN("John", "jnoble@jpowerusa.com"),
    JUAN("Juan", "jsilva@jpowerusa.com"),
    JUSTIN("Justin", "jwandahovich@jpowerusa.com"),
    MATT("Matt", "mwrightsman@jpowerusa.com"),
    RIGO("Rigo", "rigarcia@jpowerusa.com"),
    RYAN("Ryan", "rsedler@jpowerusa.com"),
    SCOTT("Scott", "sfreese@jpowerusa.com"),
    SIDNEY("Sidney", "sbazemore@jpowerusa.com"),
    STUART("Stuart", "sowens@jpowerusa.com");

    private final String displayName;
    private final String email;

    Emails(String displayName, String email) {
        this.displayName = displayName;
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }
}
