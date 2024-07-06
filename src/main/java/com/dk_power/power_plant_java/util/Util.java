package com.dk_power.power_plant_java.util;

import lombok.Data;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

import java.beans.PropertyDescriptor;
import java.util.ArrayList;
import java.util.List;
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







}
