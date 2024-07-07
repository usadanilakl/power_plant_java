package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final UserDetailsServiceImpl customUserDetails;
    @Override
    public List<Loto> getAll() {
        return lotoRepo.findAll();
    }

    @Override
    public List<Loto> getAllSorted(String column) {
        return lotoRepo.findAll(Sort.by(column));
    }

    @Override
    public Loto getById(Long id) {
        return lotoRepo.findById(id).orElse(null);
    }

    @Override
    public List<Loto> getByCreatedBy() {
        return lotoRepo.findByCreatedBy(customUserDetails.getUsersName());
    }

    @Override
    public Loto save(Loto entity) {
        return lotoRepo.save(entity);
    }

    @Override
    public Loto createNew(LotoDto dto, Class<Loto> tClass) {
        Loto permit = permitMapper.convertToEntity(dto, tClass);
        //permit.setDocNum(permitNumbersService.getNumber(permit.getType()));
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        return save(permit);
    }

    @Override
    public Loto changeStatus(Long id, Status status) {
        return null;
    }

    @Override
    public List<Loto> sortTable(String column) {
        return null;
    }

    @Override
    public List<Loto> filterTable(Map<String, String> filters) {
        return null;
    }

    @Override
    public List<Loto> getLastFilteredList() {
        return null;
    }

    @Override
    public List<Loto> clearFilters() {
        return null;
    }

    @Override
    public void filterNew(Loto entity) {

    }

    @Override
    public Loto resetFields() {
        return null;
    }

    @Override
    public Loto convertToEntity(LotoDto dto, Class<Loto> tClass) {
        return null;
    }

    @Override
    public LotoDto convertToDto(Loto entity, Class<LotoDto> dClass) {
        return null;
    }

    @Override
    public Loto getTempPermit() {
        return null;
    }

    @Override
    public String getLoggedInUserName() {
        return null;
    }

    @Override
    public Long generatePermitNum() {
        return null;
    }

    @Override
    public List<Loto> getRevision(Long id, Class<Loto> entityClass) {
        return null;
    }

    @Override
    public LotoDto getDtoById(String ID) {
        return null;
    }
}
