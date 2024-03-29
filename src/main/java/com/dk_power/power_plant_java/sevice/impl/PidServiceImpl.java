package com.dk_power.power_plant_java.sevice.impl;

import com.dk_power.power_plant_java.model.File;
import com.dk_power.power_plant_java.model.PID;
import com.dk_power.power_plant_java.repository.PidRepo;
import com.dk_power.power_plant_java.sevice.PidService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
@AllArgsConstructor
public class PidServiceImpl implements PidService {
    private final PidRepo pidRepo;
    @Override
    public void createNewPid(String type, String name, String number, String vendor, String folder, String system) {
        PID pid = PID.builder()
                .type(type)
                .vendor(vendor)
                .number(number)
                .name(name)
                .folder(folder)
                .system(system)
                .build();
        pidRepo.save(pid);
        System.out.println("File added"+pid.getId());
    }

    @Override
    public Iterable<PID> getAllPids() {
        return pidRepo.findAll();
    }

    @Override
    public List<PID> getPidsByName(String name) {
        return pidRepo.findByName(name);
    }

    @Override
    public List<PID> getPidsByNumber(String num) {
        return pidRepo.findByNumber(num);
    }

    @Override
    public List<PID> getPidsByVendor(String vend) {
        return pidRepo.findByVendor(vend);
    }

    @Override
    public void deletByVendor(String vendor) {
        //fileRepo.deleteAllByVendor(vendor);
        pidRepo.deleteAll();
    }


}
