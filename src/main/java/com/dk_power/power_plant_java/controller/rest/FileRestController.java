package com.dk_power.power_plant_java.controller.rest;

import com.dk_power.power_plant_java.entities.files.PID;
import com.dk_power.power_plant_java.sevice.files.PidService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@Data
@RestController
@RequestMapping("/data")
public class FileRestController {
    private final PidService ps;

    @GetMapping("/get-files")
    public Iterable<PID> getFiles(){
        return ps.getAllPids();
    }

    @DeleteMapping("/delete-kiewit")
    public void deleteKiewit(){
        System.out.println("deleting");
        ps.deletByVendor("Kiewit");
    }
}
