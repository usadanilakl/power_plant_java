package com.dk_power.power_plant_java.util;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class DataGenerator {
//    private final LotoService lotoService;
//    private final SwService swService;
//    private final TicketService ticketService;
//    private final UserRepo userRepo;
//    private final BasePermitService<Loto, LotoDto> basePermitService;
//    public void createLoto(){
//        Loto loto = new Loto();
//        loto.setCreatedBy("Danil");
//        loto.setControlAuthority("Stu");
//        loto.setWorkScope("Working");
//        loto.setEquipment("Turbine");
//        lotoService.save(loto);
//    }
//
//    public void createSw(){
//        Sw loto = new Sw();
//        loto.setCreatedBy("Danil");
//        loto.setControlAuthority("Stu");
//        loto.setWorkScope("Working");
//        loto.setEquipment("Turbine");
//        swService.save(loto);
//    }
//
//    public void createTicket(){
//        Ticket loto = new Ticket();
//        loto.setCreatedBy("Danil");
//        loto.setControlAuthority("Stu");
//        loto.setWorkScope("Working");
//        loto.setEquipment("Turbine");
//        ticketService.save(loto);
//    }
//
//    public void createUser(){
//        User user = new User();
//        user.setEmail("agorelik@jpowerusa.com");
//        user.setName("Andrew Gorelik");
//        user.setPassword("123");
//        user.setRole("Operator");
//        userRepo.save(user);
//    }
//
//    public void resetLotoDocNumber(){
//        Iterable<Loto> all = lotoService.getAll();
//        all.forEach(e->{
//            e.setDocNum(null);
//            lotoService.save(e);
//        });
//        all.forEach(e->{
//            e.setDocNum(basePermitService.generatePermitNum());
//            lotoService.save(e);
//        });
//    }
}
