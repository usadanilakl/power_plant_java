package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.model.File;
import com.dk_power.power_plant_java.model.PID;

import java.util.List;

public interface PidService {
/*********************FILE FUNCTIONS*****************************
 Create new file
 Update existing file
 Find/View file
****************************************************************/

void createNewPid(String type, String name, String number, String vendor, String folder, String system);
Iterable<PID> getAllPids();
List<PID> getPidsByName(String name);
List<PID> getPidsByNumber(String num);
List<PID> getPidsByVendor(String vend);
PID getPidById(Long id);

void updatePid(Long id,PID newPid);

void deletByVendor(String vendor);

}
