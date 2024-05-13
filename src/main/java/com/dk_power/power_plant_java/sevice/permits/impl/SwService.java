package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.safe_works.BaseSw;
import com.dk_power.power_plant_java.entities.permits.safe_works.Sw;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.safe_work_repo.BaseSwRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class SwService extends BasePermitServiceImpl<Sw, SwDto>{
    private final BaseSwRepo swRepo;

    public SwService(@Qualifier("swRepo")BasePermitRepo<Sw> repository, PermitNumbersService permitNumbersService, FilterService<Sw> filterService, UserDetailsServiceImpl customUserDetails, BasePermitMapper<Sw, SwDto> permitMapper, BaseSwRepo swRepo) {
        super(repository, permitNumbersService, filterService, customUserDetails, permitMapper);
        this.swRepo = swRepo;
    }

    public BaseSw saveTempSw(BaseSw sw){
        swRepo.save(sw);
        return sw;
    }
}
