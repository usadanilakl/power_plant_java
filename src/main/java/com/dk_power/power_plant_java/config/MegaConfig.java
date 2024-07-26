package com.dk_power.power_plant_java.config;

import io.github.eliux.mega.Mega;
import io.github.eliux.mega.MegaSession;
import io.github.eliux.mega.auth.MegaAuthCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

//@Configuration
public class MegaConfig {

    @Value("${mega.username}")
    private String username;

    @Value("${mega.password}")
    private String password;

    @Bean
    public MegaSession megaCmdClient() {
       if(Mega.currentSession()==null) return Mega.login(new MegaAuthCredentials(username,password));
       else return Mega.currentSession();
//        return Mega.init();
    }
}