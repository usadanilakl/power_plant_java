package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.pojo.PersonnelSignEntry;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoService implements NgCrudService<Loto, LotoDto, LotoRepo, LotoMapper> {
    private final LotoMapper mapper;
    private final LotoRepo repo;
    private final EntityManager entityManager;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;
    private final NgLotoPointService lotoPointService;
    private final NgLotoBoxService lotoBoxService;
    private final NgLockService lockService;
    private final LotoSnapshotRepo lotoSnapshotRepo;
    private final LotoStandardRepo lotoStandardRepo;
    private final com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService lotoAssignmentService;
    private final com.dk_power.power_plant_java.repository.permits.JobLogRepo jobLogRepo;

    @Override
    public LotoRepo getRepo() {
        return this.repo;
    }

    @Override
    public LotoMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Loto> getEntityClass() {
        return Loto.class;
    }

    @Override
    public Loto save(Loto entity) {
        if(entity.isArchived()) throw new IllegalArgumentException("Archived loto cannot be saved");
        lotoSnapshotRepo.save(entity.getLatestSnapshot());
        return this.repo.save(entity);
    }

    @Transactional
    public void deleteLoto(Long id) {
        Loto loto = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + id));
        loto.setDeleted(true);
        repo.saveAndFlush(loto);
    }

    public Optional<Loto> findById(Long id) {
        return this.repo.findById(id);
    }

    public Optional<LotoDto> findDtoById(Long id) {
        return this.findById(id).map(this::toDto);
    }

    public Page<LotoDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("docNum", searchString);
        searchCriteria.put("workScope", searchString);
        searchCriteria.put("system.name", searchString);
        searchCriteria.put("permitStatus.name", searchString);
        searchCriteria.put("permitType.name", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
//        return complexSearch(sc).stream().map(this::toDto).toList();
        return complexSearch(sc, page, size, "socNum", "asc", false);
    }

    public Set<String> getRelatedImages(Long id) {
        return repo.findById(id)
                .map(loto -> loto.getLotoPoints().stream()
                        .map(l -> lotoPointService.getRelatedImages(l.getId()))
                        .flatMap(Collection::stream)
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

    @Override
    public Loto toEntity(LotoDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public LotoDto toDto(Loto entity) {
        return mapper.convertToDto(entity);
    }

    @Transactional
    public Loto update(LotoIdDto dto) {
        Loto loto;
        boolean isNewLoto = dto.getId() == null || dto.getId() == 0;

        if (isNewLoto) {
            loto = new Loto();
        } else {
            loto = repo.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + dto.getId()));
        }

        // Update Loto with new data
        mapper.updateLotoFromDto(dto, loto);

        // Handle LotoPoints
        Set<Long> newLotoPointIds = dto.getLotoPoints() != null ? new HashSet<>(dto.getLotoPoints()) : new HashSet<>();

        if (loto.getLotoPoints() == null) {
            loto.setLotoPoints(new HashSet<>());
        }

        loto.getSnapshots().forEach(s->{
            if(s.getId()==null) lotoSnapshotRepo.save(s);
        });

        return repo.save(loto);
    }

    public List<LotoPointDto> getActiveLotoPoints() {
//        return repo.findAll().stream()
//                .filter(loto -> loto.getLotoPoints() != null && !loto.getLotoPoints().isEmpty())
//                .flatMap(loto -> loto.getLotoPoints().stream())
//                .distinct()
//                .map(lotoPointService::toDto)
//                .collect(Collectors.toList());
        return null;
    }

    public LotoDto addLotoPointToLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        LotoPoint point = lotoPointService.findById(pointId)
               .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + pointId));

        loto.addLotoPoint(lotoPointService.toIdDto(point));

        return toDto(save(loto));
    }

    private LotoPointIdDto toIdDto(LotoPoint point) {
        return this.mapper.toIdDto(point);
    }

    public LotoDto removeLotoPointFromLoto(Long pointId, Long lotoId) {
        Loto loto = repo.findById(lotoId)
               .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));


        loto.getLotoPoints().forEach(p -> {
            System.out.println(p.getTagNumber());
        });
        System.out.println("==================");

        loto.removeLotoPoint(pointId);

        loto.getLotoPoints().forEach(p -> {
            System.out.println(p.getTagNumber());
        });
        return toDto(save(loto));
    }


    public List<FileDto> getRelatedFiles(Long lotoStandardId) {
        Loto loto = getEntityById(lotoStandardId);
        if (loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        List<LotoPoint> points = loto.getLotoPoints().stream().map(lotoPointService::convertIdDtoToEntity).toList();
        if(points==null || points.isEmpty()) return List.of();
        Set<FileDto> files = new HashSet<>();
        for(LotoPoint point : points){
            files.addAll(lotoPointService.getRelatedFiles(point.getId()));
        }

        return files.stream().distinct().toList();
    }

    public LotoDto reorderLotoPoints(Long currentLotoId, List<Long> lotoPoints) {
        Loto loto = getEntityById(currentLotoId);
        if(loto == null) {
            throw new EntityNotFoundException("Loto not found");
        }
        loto.reorderLotoPoints(lotoPoints);
        return toDto(save(loto));
    }

    public List<LotoDto> saveAll(List<LotoIdDto> lotos) {
        return lotos.stream()
               .map(this::idDtoToEntity)
                .map(this::save)
               .map(this::toDto)
               .collect(Collectors.toList());
    }

    private Loto idDtoToEntity(LotoIdDto lotoIdDto) {
        return this.mapper.convertIdDtoToEntity(lotoIdDto);
    }

    /*********************************************************************************************************************
     * LOTO PERMIT WORKFLOW
     ******************************************************************************************************************/

    @Transactional
    public LotoDto createFromStandard(Long standardId, LotoIdDto permitData, Integer requestedBoxNumber) {
        LotoStandard standard = lotoStandardRepo.findById(standardId)
                .orElseThrow(() -> new EntityNotFoundException("LotoStandard not found with id: " + standardId));

        Loto loto = new Loto();
        if (permitData != null) mapper.updateLotoFromDto(permitData, loto);
        loto.setSourceStandard(standard);
        loto.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));

        LotoSnapshot snapshot = loto.createNewSnapshot();
        snapshot.setSnapshotReason("Created from standard: " + standard.getName());

        Set<LotoPointIdDto> pointDtos = new HashSet<>();
        for (LotoPoint point : standard.getLotoPoints()) {
            pointDtos.add(lotoPointService.toIdDto(point));
        }
        snapshot.setLotoPointDtos(pointDtos);
        try {
            snapshot.setLotoPointOrder(new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(standard.getLotoPointOrder()));
        } catch (Exception e) {
            snapshot.setLotoPointOrder("{}");
        }

        loto = repo.save(loto);
        lotoSnapshotRepo.save(snapshot);

        // Auto-assign box + locks based on point count
        int pointCount = standard.getLotoPoints().size();
        if (requestedBoxNumber != null) {
            lotoBoxService.assignBoxToLoto(loto, requestedBoxNumber);
        } else {
            lotoAssignmentService.autoAssign(loto, pointCount);
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Building");
        }

        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto createFromScratch(LotoIdDto permitData, Integer requestedBoxNumber) {
        Loto loto = new Loto();
        if (permitData != null) mapper.updateLotoFromDto(permitData, loto);
        loto.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));

        LotoSnapshot snapshot = loto.createNewSnapshot();
        snapshot.setSnapshotReason("Created from scratch");

        loto = repo.save(loto);
        lotoSnapshotRepo.save(snapshot);

        // Auto-assign box (no locks yet since no points)
        if (requestedBoxNumber != null) {
            lotoBoxService.assignBoxToLoto(loto, requestedBoxNumber);
        } else {
            lotoAssignmentService.autoAssign(loto, 0);
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Building");
        }

        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto changeStatus(Long lotoId, String newStatus) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        String currentStatus = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        validateStatusTransition(currentStatus, newStatus);

        switch (newStatus) {
            case "Active" -> {
                LotoSnapshot latest = loto.getLatestSnapshot();
                latest.setPersonnelSnapshot(loto.getPersonnelJson());
                latest.setSnapshotReason("Test".equals(currentStatus) ? "Re-Activated" : "Activated");
                lotoSnapshotRepo.save(latest);
            }
            case "Test" -> {
                LotoSnapshot latest = loto.getLatestSnapshot();
                try {
                    LotoSnapshot testSnapshot = (LotoSnapshot) latest.clone();
                    testSnapshot.setId(null);
                    testSnapshot.setDateCreated(java.time.LocalDateTime.now());
                    testSnapshot.setLoto(loto);
                    testSnapshot.setSnapshotReason("Test Started");
                    loto.getSnapshots().add(testSnapshot);
                    lotoSnapshotRepo.save(testSnapshot);
                } catch (CloneNotSupportedException e) {
                    throw new RuntimeException("Failed to clone snapshot for test", e);
                }
            }
            case "Closed" -> {
                LotoSnapshot latest = loto.getLatestSnapshot();
                latest.setPersonnelSnapshot(loto.getPersonnelJson());
                latest.setSnapshotReason("Closed");
                lotoSnapshotRepo.save(latest);
                // Release locks back to inventory
                lotoAssignmentService.releaseLocks(loto);
                // Release box
                if (loto.getLotoBox() != null) lotoBoxService.releaseBox(loto.getLotoBox());
            }
        }

        Value statusValue = ngValueService.createValue("Permit Status", newStatus);
        loto.setPermitStatus(statusValue);

        if (!"Closed".equals(newStatus) && loto.getLotoBox() != null) {
            lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), newStatus);
        }

        return toDto(repo.save(loto));
    }

    private void validateStatusTransition(String current, String target) {
        if (target == null) throw new IllegalArgumentException("Target status cannot be null");
        Set<String> allowed = switch (current != null ? current : "") {
            case "Building" -> Set.of("Active", "Closed");
            case "Active" -> Set.of("Test", "Closed");
            case "Test" -> Set.of("Active", "Closed");
            case "Closed" -> Set.of();
            default -> Set.of("Active", "Building", "Closed");
        };
        if (!allowed.contains(target)) {
            throw new IllegalArgumentException("Invalid status transition: " + (current != null ? current : "null") + " → " + target);
        }
    }

    @Transactional
    public LotoDto signOnPerson(Long lotoId, PersonnelSignEntry entry) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        entry.setSignOnTime(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        List<PersonnelSignEntry> personnel = loto.getPersonnel();
        personnel.add(entry);
        loto.setPersonnel(personnel);
        return toDto(repo.save(loto));
    }

    @Transactional
    public LotoDto signOffPerson(Long lotoId, String personName, String comments) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        boolean found = loto.signOffPerson(personName, null, comments);
        if (!found) throw new EntityNotFoundException("No active sign-on found for: " + personName);
        return toDto(repo.save(loto));
    }

    public List<PersonnelSignEntry> getPersonnel(Long lotoId) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
        return loto.getPersonnel();
    }

    @Transactional
    public LotoDto assignLocksToPoints(Long lotoId, List<Map<String, Object>> lockAssignments) {
        Loto loto = repo.findById(lotoId)
                .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));

        for (Map<String, Object> assignment : lockAssignments) {
            Long pointId = Long.valueOf(assignment.get("lotoPointId").toString());
            String tagLabel = assignment.get("tagLabel") != null ? assignment.get("tagLabel").toString() : null;
            String lockType = assignment.get("lockType") != null ? assignment.get("lockType").toString() : "LOCK";
            Integer lockNumber = assignment.get("lockNumber") != null
                    ? Integer.valueOf(assignment.get("lockNumber").toString()) : null;

            Lock lock = loto.getLocks() != null
                    ? loto.getLocks().stream()
                        .filter(l -> pointId.equals(l.getAssignedLotoPointId()))
                        .findFirst().orElse(null)
                    : null;

            if (lock == null) {
                lock = new Lock();
                lock.setLoto(loto);
            }
            lock.setAssignedLotoPointId(pointId);
            lock.setTagLabel(tagLabel);
            lock.setLockType(lockType);
            if (lockNumber != null) lock.setNumber(lockNumber);
            lockService.save(lock);
        }

        return toDto(repo.findById(lotoId).orElseThrow());
    }

    /*********************************************************************************************************************
     * LOTO USAGE MONITOR
     ******************************************************************************************************************/

    /**
     * Returns all active LOTOs with their associated jobs and foremen.
     * Used by the LOTO Usage Monitor table to help foremen see what to sign on to
     * and operators see if a LOTO is no longer needed (no associated jobs).
     */
    public List<Map<String, Object>> getLotoUsageMonitor() {
        List<Map<String, Object>> result = new ArrayList<>();

        // Get all LOTOs that are not closed
        List<Loto> activeLots = repo.findAll().stream()
                .filter(loto -> {
                    String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
                    return status != null && !"Closed".equals(status);
                })
                .toList();

        // Get all open jobs with their LOTOs
        List<com.dk_power.power_plant_java.entities.permits.JobLog> openJobs = jobLogRepo.findAllOpenJobs();

        for (Loto loto : activeLots) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", loto.getId());
            row.put("boxNumber", loto.getBoxNumber());
            row.put("permitNumber", loto.getPermitNumber());
            row.put("name", loto.getName());
            row.put("workScope", loto.getWorkScope());
            row.put("equipmentSystem", loto.getEquipmentSystem());
            row.put("status", loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null);
            row.put("pointCount", loto.getLotoPointDtos() != null ? loto.getLotoPointDtos().size() : 0);
            row.put("lockCount", loto.getLocks() != null ? loto.getLocks().size() : 0);

            // Find associated jobs
            List<Map<String, Object>> associatedJobs = new ArrayList<>();
            for (var job : openJobs) {
                if (job.getLotos() != null && job.getLotos().contains(loto)) {
                    Map<String, Object> jobInfo = new LinkedHashMap<>();
                    jobInfo.put("jobId", job.getId());
                    jobInfo.put("permitNumber", job.getPermitNumber());
                    jobInfo.put("foreman", job.getForeman());
                    jobInfo.put("company", job.getCompany());
                    jobInfo.put("workScope", job.getWorkScope());
                    associatedJobs.add(jobInfo);
                }
            }
            row.put("associatedJobs", associatedJobs);

            // Extract foremen names
            List<String> foremen = associatedJobs.stream()
                    .map(j -> (String) j.get("foreman"))
                    .filter(f -> f != null && !f.isEmpty())
                    .distinct()
                    .toList();
            row.put("foremen", foremen);
            row.put("jobCount", associatedJobs.size());
            row.put("hasNoJobs", associatedJobs.isEmpty());

            result.add(row);
        }

        return result;
    }

    /**
     * Activate all LOTOs that have no status or are in Building status.
     * Sets their permitStatus to "Active" and updates box LED color.
     */
    @Transactional
    public String activateAllLotos() {
        List<Loto> allLotos = repo.findAll();
        int activated = 0;

        for (Loto loto : allLotos) {
            String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
            if (status == null || status.isEmpty() || "Building".equals(status)) {
                loto.setPermitStatus(ngValueService.createValue("Permit Status", "Active"));
                repo.save(loto);

                if (loto.getLotoBox() != null) {
                    lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), "Active");
                }
                activated++;
            }
        }

        return "Activated " + activated + " LOTOs";
    }
}
