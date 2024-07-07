package com.dk_power.power_plant_java.repository.plant;

import com.dk_power.power_plant_java.entities.Vendor;

public interface VendorRepo extends GroupRepo<Vendor> {
    Vendor findByName(String vendor);
}

