package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaUserRegistrationDto {
    private String pwaUserUuid;
    private String name;
    private String email;
    private String phone;
    private String company;
    private String password;
}
