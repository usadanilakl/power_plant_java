package com.dk_power.power_plant_java.util;

import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.repository.permits.LotoDtoRepo;
import com.dk_power.power_plant_java.repository.permits.LotoRepo;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.access.method.P;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;


@Data
public class PermitNumberGenerator {
    public static Long lotoNumber = 0L;
    public static Long generate(Long lastCreatedNumber){
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }
    public static Long generateLotoNumber(){
        return generate(lotoNumber);
    }

}
