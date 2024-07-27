package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.util.PropertyReader;
import org.kohsuke.github.GitHub;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Configuration
public class GitHubConfig {
    @Value("${git.token}")
    String gitToken;
    @Bean
    public GitHub connectToGitHub(){
        try {
            return GitHub.connectUsingOAuth(gitToken);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
