package com.dk_power.power_plant_java.util;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class PropertyReader {
    Properties prop = new Properties();
    InputStream input;

    {
        try {
            input = new FileInputStream("token.properties");
            prop.load(input);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public String token = prop.getProperty("token");
}
