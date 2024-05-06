package com.dk_power.power_plant_java.util;

import com.dk_power.power_plant_java.entities.permits.Loto;
import lombok.Data;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;


@Data
public class Util {
    public static <T> List<T> toList(Iterable<T> iterable) {
        List<T> list = new ArrayList<>();
        iterable.forEach(list::add);
        return list;
    }







}
