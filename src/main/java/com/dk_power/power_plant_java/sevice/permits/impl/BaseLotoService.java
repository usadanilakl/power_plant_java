package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BaseLotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import org.springframework.stereotype.Service;

@Service
public class BaseLotoService extends BasePermitServiceImpl<BaseLoto, BaseLotoDto>{
    private final BaseLotoRepo baseLotoRepo;
    public BaseLotoService(BasePermitRepo<BaseLoto> repository, PermitNumbersService permitNumbersService, FilterService<BaseLoto> filterService, UserDetailsServiceImpl customUserDetails, BaseLotoRepo baseLotoRepo) {
        super(repository, permitNumbersService, filterService, customUserDetails);
        this.baseLotoRepo = baseLotoRepo;
    }

    @Override
    public BaseLoto getByCreatedBy() {
        BaseLoto loto = super.getByCreatedBy();
        if(loto==null){
            loto = new BaseLoto();
            baseLotoRepo.save(loto);
        }
        return loto;
    }

    public BaseLoto saveTempLoto(BaseLoto loto){
        baseLotoRepo.save(loto);
        return loto;
    }
}
