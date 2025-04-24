package com.dk_power.power_plant_java.annotations;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.dk_power.power_plant_java.config.EntityOrIdDeserializer;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@JacksonAnnotationsInside
@JsonDeserialize(using = EntityOrIdDeserializer.class)
public @interface DeserializeEntityOrId {
    Class<?> entityClass();
}