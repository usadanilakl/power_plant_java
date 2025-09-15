package com.dk_power.power_plant_java.sevice.forms;

import com.dk_power.power_plant_java.dto.forms.FormContainerDto;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.mappers.forms.FormContainerMapper;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class FormContainerService implements NgCrudService<FormContainer, FormContainerDto, FormContainerRepo, FormContainerMapper> {
    private final FormContainerRepo formContainerRepo;
    private final FormContainerMapper formContainerMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;


    @Override
    public FormContainerRepo getRepo() {
        return formContainerRepo;
    }

    @Override
    public FormContainerMapper getMapper() {
        return formContainerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public FormContainerDto getDto() {
        return new FormContainerDto();
    }

    @Override
    public FormContainer getEntity() {
        return new FormContainer();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<FormContainer> getEntityClass() {
        return FormContainer.class;
    }


}
