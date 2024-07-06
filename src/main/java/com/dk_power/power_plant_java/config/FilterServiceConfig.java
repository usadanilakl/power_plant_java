package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.entities.permits.safe_works.Sw;
import com.dk_power.power_plant_java.entities.permits.tickets.Ticket;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.sevice.permits.impl.FilterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterServiceConfig {
    @Autowired
    private BasePermitRepo<Loto> lotoRepo;
    @Autowired
    private BasePermitRepo<BaseLoto> baseLotoRepo;
    @Autowired
    private BasePermitRepo<Ticket> ticketRepo;
    @Autowired
    private BasePermitRepo<Sw> swRepo;

    @Bean
    public FilterService<Loto> lotoFilterService() {
        return new FilterService<>(lotoRepo);
    }
    @Bean
    public FilterService<BaseLoto> baseLotoFilterService() {
        return new FilterService<>(baseLotoRepo);
    }
    @Bean
    public FilterService<Ticket> ticketFilterService() {
        return new FilterService<>(ticketRepo);
    }
    @Bean
    public FilterService<Sw> swFilterService() {
        return new FilterService<>(swRepo);
    }
}
