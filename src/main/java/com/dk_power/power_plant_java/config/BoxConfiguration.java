package com.dk_power.power_plant_java.config;

import com.box.sdk.BoxConfig;
import com.box.sdk.BoxDeveloperEditionAPIConnection;
import com.dk_power.power_plant_java.entities.loto.Box;
import com.dk_power.power_plant_java.util.Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
public class BoxConfiguration {

    @Value("${box.client-id}")
    private String clientId;

    @Value("${box.client-secret}")
    private String clientSecret;

    @Value("${box.enterprise-id}")
    private String enterpriseId;

    @Value("${box.public-key-id}")
    private String publicKeyId;

    @Value("${box.private-key-file}")
    private String privateKeyFile;

    @Value("${box.private-key-password}")
    private String privateKeyPassword;

    @Bean
    public BoxDeveloperEditionAPIConnection boxAPIConnection() throws IOException {
        // Read the private key as a string
        String privateKey = Util.decryptPEMKey(privateKeyFile,privateKeyPassword);

        // Create a BoxConfig object using the builder
//        BoxConfig boxConfig = new BoxConfig(clientId,clientSecret);
        BoxConfig boxConfig = new BoxConfig(clientId,clientSecret,enterpriseId,publicKeyId,privateKey,privateKeyPassword);

        // Return the BoxDeveloperEditionAPIConnection object
        return BoxDeveloperEditionAPIConnection.getAppEnterpriseConnection(boxConfig);
    }
}