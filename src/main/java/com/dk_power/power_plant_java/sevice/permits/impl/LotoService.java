package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class LotoService extends BasePermitServiceImpl<Loto, LotoDto>{
    private final BaseLotoRepo baseLotoRepo;

    public LotoService(@Qualifier("lotoRepo") BasePermitRepo<Loto> repository, PermitNumbersService permitNumbersService, FilterService<Loto> filterService, UserDetailsServiceImpl customUserDetails, BaseLotoRepo baseLotoRepo) {
        super(repository, permitNumbersService, filterService, customUserDetails);
        this.baseLotoRepo = baseLotoRepo;
    }




}

