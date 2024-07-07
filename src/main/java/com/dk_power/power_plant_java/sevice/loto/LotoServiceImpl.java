package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities2.equipment.LotoPoint;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.AllArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final UserDetailsServiceImpl customUserDetails;
    private final UniversalMapper universalMapper;
    private final EntityManagerFactory entityManagerFactory;
    private final LotoPointService lotoPointService;
    @Override
    public List<Loto> getAll() {
        return lotoRepo.findAll();
    }

    @Override
    public List<Loto> getAllSorted(String column) {
        return lotoRepo.findAll(Sort.by(column));
    }

    @Override
    public Loto getEntityById(Long id) {
        return lotoRepo.findById(id).orElse(null);
    }
    @Override
    public LotoDto getDtoById(String ID) {
        Loto lot = lotoRepo.findById(Long.parseLong(ID)).orElse(null);
        return universalMapper.convert(lot,new LotoDto());
    }
    @Override
    public List<Loto> getByCreatedBy() {
        return lotoRepo.findByCreatedBy(customUserDetails.getUsersName());
    }

    @Override
    public Loto saveEntity(Loto entity) {
        if(entity.getLotoPoints()!=null){
            for (LotoPoint p : entity.getLotoPoints()) {
                p.addPermLoto(entity);
                //entity.addPoint(p);
                lotoPointService.saveEntity(p);
            }
        }
        else System.out.println("points are null");
        return lotoRepo.save(entity);
    }

    @Override
    public Loto saveDto(LotoDto dto) {
        Loto entity = universalMapper.convert(dto,new Loto());
        return saveEntity(entity);
    }

    @Override
    public Loto createNew(LotoDto dto) {
        Loto permit = universalMapper.convert(dto, new Loto());
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        return saveEntity(permit);
    }

    @Override
    public Loto changeStatus(Long id, Status status) {
        Loto permit = getEntityById(id);
        permit.setStatus(status);
        return saveEntity(permit);
    }

//    @Override
//    public List<Loto> sortTable(String column) {
//        return null;
//    }
//
//    @Override
//    public List<Loto> filterTable(Map<String, String> filters) {
//        return null;
//    }
//
//    @Override
//    public List<Loto> getLastFilteredList() {
//        return null;
//    }
//
//    @Override
//    public List<Loto> clearFilters() {
//        return null;
//    }
//
//    @Override
//    public void filterNew(Loto entity) {
//
//    }
//
//    @Override
//    public Loto resetFields() {
//        return null;
//    }

    @Override
    public Loto getTempPermit() {
        return lotoRepo.getTempPermit(customUserDetails.getUsersName());
    }

    @Override
    public Long generatePermitNum() {
        Long lastCreatedNumber = lotoRepo.findMaxPermitNum();
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }

    @Override
    public List<Loto> getRevision(Long id) {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        List<Loto> entities = new ArrayList<>();
        try {
            AuditReader reader = AuditReaderFactory.get(entityManager);
            AuditQuery query = reader.createQuery().forRevisionsOfEntity(Loto.class, false, true);
            query.add(AuditEntity.id().eq(id));
            List<Object[]> result = query.getResultList();
            result.forEach(e->entities.add((Loto)(e[0])));

        } finally {
            if (entityManager != null) {
                entityManager.close();
            }
        }
        return entities;
    }

}
