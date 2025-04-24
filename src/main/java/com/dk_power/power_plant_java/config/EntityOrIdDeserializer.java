package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.annotations.DeserializeEntityOrId;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class EntityOrIdDeserializer extends JsonDeserializer<Object> implements ContextualDeserializer, ApplicationContextAware {

    private static ApplicationContext applicationContext;

    private Class<?> entityClass;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        EntityOrIdDeserializer.applicationContext = applicationContext;
    }

    @Override
    public Object deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        
        if (node.isNumber()) {
            Long id = node.asLong();
            CrudRepository<?, Long> repository = getRepositoryForEntity(entityClass);
            return repository.findById(id).orElse(null);
        } else if (node.isObject()) {
            return p.getCodec().treeToValue(node, entityClass);
        }
        
        return null;
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        DeserializeEntityOrId annotation = property.getAnnotation(DeserializeEntityOrId.class);
        if (annotation != null) {
            EntityOrIdDeserializer deserializer = new EntityOrIdDeserializer();
            deserializer.entityClass = annotation.entityClass();
            return deserializer;
        }
        return this;
    }

    private CrudRepository<?, Long> getRepositoryForEntity(Class<?> entityClass) {
        String repositoryBeanName = entityClass.getSimpleName() + "Repo";
        return (CrudRepository<?, Long>) applicationContext.getBean(repositoryBeanName);
    }
}