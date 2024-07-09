package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.equipment.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final UserDetailsServiceImpl customUserDetails;
    private final UniversalMapper universalMapper;
    private final EntityManagerFactory entityManagerFactory;
    private final LotoPointService lotoPointService;
    private final SessionFactory sessionFactory;


    @Override
    public UserDetailsServiceImpl getUserDetails() {
        return customUserDetails;
    }

    @Override
    public EntityManagerFactory getEntityManager() {
        return entityManagerFactory;
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public LotoRepo getRepo() {
        return lotoRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
