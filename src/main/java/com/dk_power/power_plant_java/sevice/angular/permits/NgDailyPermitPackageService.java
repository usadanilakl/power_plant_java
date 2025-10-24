package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.ConfinedSpaceMapper;
import com.dk_power.power_plant_java.mappers.permits.DailyPermitPackageMapper;
import com.dk_power.power_plant_java.mappers.permits.HotWorkMapper;
import com.dk_power.power_plant_java.mappers.permits.SafeWorkMapper;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.sikuli.script.FindFailed;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDailyPermitPackageService implements NgCrudService<DailyPermitPackage, DailyPermitPackageDto, DailyPermitPackageRepo, DailyPermitPackageMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final RedTagAutomationService redTagAutomationService;

    private final SafeWorkMapper safeWorkMapper;
    private final HotWorkMapper hotWorkMapper;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final WorkRequestRepo workRequestRepo;

    @Override
    public DailyPermitPackageRepo getRepo() {
        return dailyPermitPackageRepo;
    }

    @Override
    public DailyPermitPackageMapper getMapper() {
        return dailyPermitPackageMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public DailyPermitPackageDto getDto() {
        return new DailyPermitPackageDto();
    }

    @Override
    public DailyPermitPackage getEntity() {
        return new DailyPermitPackage();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<DailyPermitPackage> getEntityClass() {
        return DailyPermitPackage.class;
    }

//    @Override
//    public DailyPermitPackage hardDelete(Long id) {
//        DailyPermitPackage entityById = getEntityById(id);
//        entityManager.remove(entityById);
//        return entityById;
//    }

    public DailyPermitPackageDto createDailyPermitPackage(DailyPermitPackageDto permitPackageDto) {
        DailyPermitPackage dailyPermitPackage = dailyPermitPackageMapper.convertToEntity(permitPackageDto);
        DailyPermitPackage saved = dailyPermitPackageRepo.save(dailyPermitPackage);
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    public DailyPermitPackageDto updateDailyPermitPackage(String id, DailyPermitPackageDto permitPackageDto) {
        DailyPermitPackage dailyPermitPackage = dailyPermitPackageMapper.convertToEntity(permitPackageDto);
        dailyPermitPackage.setId(Long.parseLong(id));
        dailyPermitPackageRepo.save(dailyPermitPackage);
        return dailyPermitPackageMapper.convertToDto(dailyPermitPackage);
    }

    public String buildPermits(DailyPermitPackageDto dailyPermitPackageDto) throws FindFailed, IOException, InterruptedException {
        DailyPermitPackage entity = toEntity(dailyPermitPackageDto);
        redTagAutomationService.buildDailyPermitPackage(toDto(entity));
        return "Permits built successfully!";
    }

    public String buildPermitsById(String id, String whatToBuild, String permitId) throws FindFailed, IOException, InterruptedException {
        DailyPermitPackage entity = getEntityById(id);
        DailyPermitPackageDto dto = toDto(entity);
        switch (whatToBuild) {
            case "all":
                redTagAutomationService.buildDailyPermitPackage(dto);
                break;
            case "loto":
                redTagAutomationService.buildLotos(dto, Long.parseLong(permitId));
                break;
            case "safeWork":
                redTagAutomationService.buildSafeWorks(dto, Long.parseLong(permitId));
                break;
            case "hotWork":
                redTagAutomationService.buildHotWorks(dto, Long.parseLong(permitId));
                break;
            case "confinedSpace":
                redTagAutomationService.buildConfinedSpaces(dto, Long.parseLong(permitId));
                break;
            default:
        }
        redTagAutomationService.buildDailyPermitPackage(dto);
        return "Permits built successfully!";
    }

    public DailyPermitPackageDto reissuePermits(String packageIdToReissue, String targetPackageId) {
        DailyPermitPackage packageToReissue = getEntityById(packageIdToReissue);
        DailyPermitPackage targetPackage = getEntityById(targetPackageId);
//        WorkRequest firstWr = new ArrayList<>(targetPackage.getWorkRequests()).getFirst();


        Set<SafeWorkDto> safeWorks = packageToReissue.getSafeWorks().stream()
                .map(safeWorkMapper::convertToDto)
                .map(sw->{
                    sw.setDate(targetPackage.getDate());
                    sw.setTime(targetPackage.getTime());
                    sw.setWorkScope(targetPackage.getName());
                    sw.setRedTagNum(null);
                    sw.setId(null);
                    return sw;
                })
                .collect(Collectors.toSet());

        Set<HotWorkDto> hotWorks = packageToReissue.getHotWorks().stream()
                .map(hotWorkMapper::convertToDto)
                .map(hw->{
                    hw.setDate(targetPackage.getDate());
                    hw.setWorkScope(targetPackage.getName());
                    hw.setRedTagNum(null);
                    hw.setId(null);
                    return hw;
                })
                .collect(Collectors.toSet());

        Set<ConfinedSpaceDto> confinedSpaces = packageToReissue.getConfinedSpaces().stream()
                .map(confinedSpaceMapper::convertToDto)
                .map(cs->{
                    cs.setDate(targetPackage.getDate());
                    cs.setTime(targetPackage.getTime());
                    cs.setWorkScope(targetPackage.getName());
                    cs.setRedTagNum(null);
                    cs.setId(null);
                    return cs;
                })
                .collect(Collectors.toSet());

        Set<Loto> lotos = packageToReissue.getLotos();

        DailyPermitPackageDto targetDto = dailyPermitPackageMapper.convertToDto(targetPackage);
        targetDto.setSafeWorks(new ArrayList<>(safeWorks));
        targetDto.setHotWorks(new ArrayList<>(hotWorks));
        targetDto.setConfinedSpaces(new ArrayList<>(confinedSpaces));

        DailyPermitPackage entity = dailyPermitPackageMapper.convertToEntity(targetDto);
        entity.setLotos(lotos);
        System.out.println("Saved lotos during reissue: " + entity.getLotos().size());
        DailyPermitPackage saved = dailyPermitPackageRepo.save(entity);
        return dailyPermitPackageMapper.convertToDto(saved);

    }

    public DailyPermitPackageDto reissuePermitsByWorkRequestId(String workRequestId) {
        DailyPermitPackage permPackage = getByWorkRequestId(workRequestId);
        if(permPackage == null) {
            throw new RuntimeException("DailyPermitPackage not found for work request: " + workRequestId);
        }
        DailyPermitPackageDto dto = toDto(permPackage);

        dto.getWorkRequests().forEach(wr ->{
            wr.setId(null);
            wr.setDateOfWorkToBePerformed(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getSafeWorks().forEach(sw -> {
            sw.setId(null);
            sw.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getHotWorks().forEach(hw -> {
            hw.setId(null);
            hw.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });
        dto.getConfinedSpaces().forEach(cs -> {
            cs.setId(null);
            cs.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/dd/yyyy")));
        });

        dto.setWorkRequestIds(new HashSet<>());
        dto.setSafeWorkIds(new HashSet<>());
        dto.setHotWorkIds(new HashSet<>());
        dto.setConfinedSpaceIds(new HashSet<>());

        DailyPermitPackage saved = dailyPermitPackageRepo.save(dailyPermitPackageMapper.convertToEntity(dto));
        return dailyPermitPackageMapper.convertToDto(saved);
    }

    private DailyPermitPackage getByWorkRequestId(String workRequestId) {
        return dailyPermitPackageRepo.findByWorkRequestId(Long.parseLong(workRequestId))
                .orElseThrow(() -> new RuntimeException("DailyPermitPackage not found for work request: " + workRequestId));
    }
}
