package com.dk_power.power_plant_java.sevice.plant;

import java.util.List;

public interface GroupService <T>{
    List<T> getAll();
    T getById();
    T save();
}
