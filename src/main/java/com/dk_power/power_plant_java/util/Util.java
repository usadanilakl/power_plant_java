package com.dk_power.power_plant_java.util;

import lombok.Data;

import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Data
public class Util {
    public static <T> List<T> toList(Iterable<T> iterable) {
        List<T> list = new ArrayList<>();
        iterable.forEach(list::add);
        return list;
    }
    public static <T> List<T> filterList(List<T> list, String propertyName, String value) {
        return list.stream()
                .filter(obj -> {
                    BeanWrapper wrapper = new BeanWrapperImpl(obj);
                    PropertyDescriptor desc = wrapper.getPropertyDescriptor(propertyName);
                    if (desc != null && desc.getReadMethod() != null) {
                        try {
                            Object propertyValue = desc.getReadMethod().invoke(obj);
                            if (propertyValue != null && propertyValue.toString().equalsIgnoreCase(value)) {
                                return true;
                            }
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }
    public static <T, U> U convert(T entity, Class<U> dtoClass) {
        U dto;
        try {
            dto = dtoClass.getDeclaredConstructor().newInstance();
            Field[] entityFields = entity.getClass().getDeclaredFields();
            Map<String, Field> dtoFieldMap = new HashMap<>();

            for (Field dtoField : dtoClass.getDeclaredFields()) {
                dtoField.setAccessible(true);
                dtoFieldMap.put(dtoField.getName(), dtoField);
            }

            for (Field entityField : entityFields) {
                entityField.setAccessible(true);
                Object value = entityField.get(entity);

                if (value != null && dtoFieldMap.containsKey(entityField.getName())) {
                    Field dtoField = dtoFieldMap.get(entityField.getName());
                    dtoField.set(dto, value);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error during conversion", e);
        }
        return dto;
    }
    public static String firstLetterToUpperCase(String sentence){
        String res = "";
        for (String word : sentence.split(",")) {
            String result = word.trim().toLowerCase();
            result = result.substring(0,1).toUpperCase()+result.substring(1);
            res +=result+" ";
        }
        return res.trim();
    }
    public static String lettersAndNumbersOnly(String input){
        String output = "";
        for (Character c : input.toCharArray()) {
            if(Character.isLetter(c) || Character.isDigit(c)) output += c;
        }
        return output;
    }







}
