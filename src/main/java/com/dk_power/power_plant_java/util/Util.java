package com.dk_power.power_plant_java.util;

import lombok.Data;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;


@Data
public class Util {
    public static Long lotoNumber = 0L;
    private static Long generate(Long lastCreatedNumber){
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }
    public static Long generateLotoNumber(){
        return generate(lotoNumber);
    }
    public static <T> List<T> toList(Iterable<T> iterable) {
        List<T> list = new ArrayList<>();
        iterable.forEach(list::add);
        return list;
    }

    public static <T> void sortList(List<T> list, String fieldName) {
        if (list == null || fieldName == null) {
            throw new IllegalArgumentException("List or fieldName cannot be null");
        }
        list.sort(Comparator.nullsLast(Comparator.comparing(o -> {
            if (o == null) {
                return null;
            }
            try {
                Field field = o.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                Object fieldValue = field.get(o);
                System.out.println(fieldValue);
                return fieldValue != null ? (Comparable) fieldValue : null;
            } catch (NoSuchFieldException | IllegalAccessException | NullPointerException e) {
                e.printStackTrace();
                return null;
            }

        })));
    }

}
