package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.entities.permits.PermitNumbers;
import com.dk_power.power_plant_java.enums.PermitType;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class PermitNumbersServiceImpl implements PermitNumbersService {
    private final PermitNumbersRepo permitNumbersRepo;
    @Override
    public Long getNumber(PermitType type) {
        PermitNumbers number = permitNumbersRepo.findById(type).orElse(null);
        if(number==null){
            number = saveNumber(new PermitNumbers(type, generate(0L)));
        }
        else{
            number.setNumber(generate(number.getNumber()));
            saveNumber(number);
        }
        return number.getNumber();
    }
    @Override
    public Long generate(Long lastCreatedNumber){
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }

    @Override
    public PermitNumbers saveNumber(PermitNumbers num) {
        return permitNumbersRepo.save(num);
    }
}
