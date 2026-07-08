package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.DailyPermitPackageMapper;
import com.dk_power.power_plant_java.mappers.permits.JobLogMapper;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.sync.OldWorkRequestExcelStatusService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NgJobLogService implements NgCrudService<JobLog, JobLogDto, JobLogRepo, JobLogMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final JobLogRepo jobLogRepo;
    private final JobLogMapper jobLogMapper;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final WorkRequestRepo workRequestRepo;
    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final NgValueService ngValueService;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final OldWorkRequestExcelStatusService oldWorkRequestExcelStatusService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public JobLogRepo getRepo() {
        return jobLogRepo;
    }

    @Override
    public JobLogMapper getMapper() {
        return jobLogMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public JobLogDto getDto() {
        return new JobLogDto();
    }

    @Override
    public JobLog getEntity() {
        return new JobLog();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<JobLog> getEntityClass() {
        return JobLog.class;
    }

    public JobLogDto createJob(JobLogDto dto) {
        JobLog entity = jobLogMapper.convertToEntity(dto);
        if (entity.getJobStatus() == null) {
            entity.setJobStatus(ngValueService.createValue("Job Status", "Open"));
        }
        JobLog saved = jobLogRepo.save(entity);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getStartDate()));
            saved = jobLogRepo.save(saved);
        }
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto createJobFromWorkRequest(String workRequestId) {
        WorkRequest wr = workRequestRepo.findById(Long.parseLong(workRequestId)).orElse(null);
        if (wr == null) throw new RuntimeException("WorkRequest not found: " + workRequestId);

        JobLog job = new JobLog();
        job.setName(truncate(wr.getWorkScope(), 250));
        job.setWorkScope(wr.getWorkScope());
        job.setCompany(wr.getCompany());
        job.setForeman(wr.getRequestedBy());
        job.setLocation(wr.getLocation());
        job.setStartDate(wr.getDateOfWorkToBePerformed());
        job.setOriginatingWorkRequest(wr);
        if (wr.getWorkArea() != null) job.setWorkArea(wr.getWorkArea());
        if (wr.getWorkCategory() != null) job.setWorkCategory(wr.getWorkCategory());
        job.setJobStatus(ngValueService.createValue("Job Status", "Open"));

        JobLog saved = jobLogRepo.save(job);
        saved.setPermitNumber(permitNumberGenerator.generate(saved.getStartDate()));
        saved = jobLogRepo.save(saved);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto addDailyPackage(String jobId, DailyPermitPackageDto packageDto) {
        JobLog job = getEntityById(jobId);
        DailyPermitPackage pkg = dailyPermitPackageMapper.convertToEntity(packageDto);
        job.addPackage(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto removePackageFromJob(String jobId, String packageId) {
        JobLog job = getEntityById(jobId);
        Long pkgId = Long.parseLong(packageId);

        DailyPermitPackage pkg = job.getPackages().stream()
                .filter(p -> p.getId().equals(pkgId))
                .findFirst().orElseThrow(() -> new RuntimeException("Package not found"));
        Set<Long> wrIds = pkg.getWorkRequests().stream()
                .map(wr -> wr.getId()).collect(Collectors.toSet());

        if (job.getOriginatingWorkRequest() != null
                && wrIds.contains(job.getOriginatingWorkRequest().getId())) {
            job.setOriginatingWorkRequest(null);
        }

        job.removePackage(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto createEmptyPackageForJob(String jobId) {
        JobLog job = getEntityById(jobId);
        DailyPermitPackage pkg = new DailyPermitPackage();
        pkg.setName(truncate(job.getName() + " - Package " + (job.getPackages().size() + 1), 250));
        pkg.setCompanyName(job.getCompany());
        pkg.setPermitNumber(permitNumberGenerator.generate(job.getStartDate()));
        job.addPackage(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto updateJob(String id, JobLogDto dto) {
        // Load the managed entity to avoid orphanRemoval deleting child packages
        JobLog existing = getEntityById(id);
        if (existing == null) throw new RuntimeException("Job not found: " + id);

        // Update only scalar fields — NEVER replace the packages collection.
        // Packages are managed via addDailyPackage/removePackageFromJob/processWorkRequest.
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getWorkScope() != null) existing.setWorkScope(dto.getWorkScope());
        if (dto.getCompany() != null) existing.setCompany(dto.getCompany());
        if (dto.getForeman() != null) existing.setForeman(dto.getForeman());
        if (dto.getLocation() != null) existing.setLocation(dto.getLocation());
        if (dto.getStartDate() != null) existing.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) existing.setEndDate(dto.getEndDate());
        if (dto.getPermitNumber() != null) existing.setPermitNumber(dto.getPermitNumber());
        if (dto.getJobStatus() != null && dto.getJobStatus().getName() != null) {
            existing.setJobStatus(ngValueService.createValue("Job Status", dto.getJobStatus().getName()));
        }
        if (dto.getOriginatingWorkRequest() != null && dto.getOriginatingWorkRequest().getId() != null) {
            existing.setOriginatingWorkRequest(
                workRequestRepo.findById(dto.getOriginatingWorkRequest().getId()).orElse(null)
            );
        }
        if (dto.getWorkArea() != null && dto.getWorkArea().getId() != null) {
            existing.setWorkArea(
                entityManager.find(com.dk_power.power_plant_java.entities.permits.WorkArea.class, dto.getWorkArea().getId())
            );
        }

        JobLog saved = jobLogRepo.save(existing);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto getByPackageId(String packageId) {
        return jobLogRepo.findByPackageId(Long.parseLong(packageId))
                .map(jobLogMapper::convertToDto)
                .orElse(null);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<JobLogDto> getAllDtos() {
        return jobLogRepo.findAll().stream()
                .map(jobLogMapper::convertToListDto)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public JobLogDto getDtoById(String id) {
        JobLog entity = getEntityById(id);
        return jobLogMapper.convertToDto(entity);
    }

    public JobLogDto closeJob(String id) {
        JobLog job = getEntityById(id);
        long openPackages = job.getPackages().stream()
                .filter(pkg -> {
                    String status = pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : "Building";
                    return !status.equals("Closed");
                })
                .count();
        if (openPackages > 0) {
            throw new RuntimeException(openPackages + " package(s) are still open. Close all packages before closing the job.");
        }
        Value closedStatus = ngValueService.createValue("Job Status", "Closed");
        job.setJobStatus(closedStatus);
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public void deleteJob(String id) {
        JobLog job = getEntityById(id);
        if (job == null) throw new RuntimeException("Job not found: " + id);
        job.setOriginatingWorkRequest(null);
        softDelete(jobLogRepo.save(job));
    }

    public List<JobLogDto> movePackageToJob(String sourceJobId, String packageId, String targetJobId) {
        Long sourceId = Long.parseLong(sourceJobId);
        Long targetId = Long.parseLong(targetJobId);
        Long pkgId = Long.parseLong(packageId);

        if (sourceId.equals(targetId)) throw new RuntimeException("Source and target jobs are the same");

        JobLog source = getEntityById(sourceJobId);
        JobLog target = getEntityById(targetJobId);
        if (source == null) throw new RuntimeException("Source job not found: " + sourceJobId);
        if (target == null) throw new RuntimeException("Target job not found: " + targetJobId);

        boolean owns = source.getPackages().stream().anyMatch(p -> p.getId().equals(pkgId));
        if (!owns) throw new RuntimeException("Package " + packageId + " not found in source job " + sourceJobId);

        // Null out originatingWorkRequest on source if it references a WR in the moving package
        DailyPermitPackage pkg = source.getPackages().stream()
                .filter(p -> p.getId().equals(pkgId)).findFirst().orElseThrow();
        Set<Long> wrIds = pkg.getWorkRequests().stream()
                .map(wr -> wr.getId()).collect(Collectors.toSet());
        if (source.getOriginatingWorkRequest() != null
                && wrIds.contains(source.getOriginatingWorkRequest().getId())) {
            source.setOriginatingWorkRequest(null);
            jobLogRepo.save(source);
        }

        source.removePackage(pkg);
        target.addPackage(pkg);
        source.setDateModified(java.time.LocalDateTime.now());
        target.setDateModified(java.time.LocalDateTime.now());
        dailyPermitPackageRepo.save(pkg);
        jobLogRepo.save(source);
        jobLogRepo.save(target);

        JobLog updatedSource = getEntityById(sourceJobId);
        JobLog updatedTarget = getEntityById(targetJobId);
        return List.of(jobLogMapper.convertToDto(updatedSource), jobLogMapper.convertToDto(updatedTarget));
    }

    public JobLogDto mergeJobs(String sourceJobId, String targetJobId) {
        Long sourceId = Long.parseLong(sourceJobId);
        Long targetId = Long.parseLong(targetJobId);

        if (sourceId.equals(targetId)) throw new RuntimeException("Cannot merge a job into itself");

        JobLog source = getEntityById(sourceJobId);
        JobLog target = getEntityById(targetJobId);
        if (source == null) throw new RuntimeException("Source job not found: " + sourceJobId);
        if (target == null) throw new RuntimeException("Target job not found: " + targetJobId);

        // Null out originatingWorkRequest before deleting source
        source.setOriginatingWorkRequest(null);
        jobLogRepo.save(source);

        Set<DailyPermitPackage> packagesToMove = new HashSet<>(source.getPackages());
        for (DailyPermitPackage pkg : packagesToMove) {
            source.removePackage(pkg);
            target.addPackage(pkg);
            dailyPermitPackageRepo.save(pkg);
        }
        source.setDateModified(java.time.LocalDateTime.now());
        target.setDateModified(java.time.LocalDateTime.now());
        jobLogRepo.save(target);

        // Delete empty source job
        JobLog emptySource = getEntityById(sourceJobId);
        jobLogRepo.delete(emptySource);

        JobLog updatedTarget = getEntityById(targetJobId);
        return jobLogMapper.convertToDto(updatedTarget);
    }

    public JobLogDto processWorkRequest(String jobId, String workRequestId) {
        JobLog job = getEntityById(jobId);
        WorkRequest wr = workRequestRepo.findById(Long.parseLong(workRequestId))
                .orElseThrow(() -> new RuntimeException("WorkRequest not found: " + workRequestId));

        // Guard: if already processed, return existing job instead of creating duplicate
        if (wr.getDailyPermitPackage() != null) {
            JobLog existingJob = jobLogRepo.findByPackageId(wr.getDailyPermitPackage().getId()).orElse(null);
            if (existingJob != null) {
                return jobLogMapper.convertToDto(existingJob);
            }
        }

        // 1. Set WR status to "Processed" in H2
        wr.setPermitStatus(ngValueService.createValue("Permit Status", "Processed"));

        // 2. Create DailyPermitPackage from WR data
        DailyPermitPackage pkg = new DailyPermitPackage();
        pkg.setName(truncate(wr.getWorkScope(), 250));
        pkg.setCompanyName(wr.getCompany());
        pkg.setPersonName(wr.getRequestedBy());
        pkg.setDate(wr.getDateOfWorkToBePerformed());
        pkg.setTime(wr.getTimeOfWorkToBePerformed());
        String dateForPermit = wr.getDateOfWorkToBePerformed() != null
                ? wr.getDateOfWorkToBePerformed()
                : job.getStartDate();
        pkg.setPermitNumber(permitNumberGenerator.generate(dateForPermit));

        // 3. Attach WR to package
        pkg.addWorkRequest(wr);

        // 4. Attach package to job
        job.addPackage(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking

        // 5. Persist
        JobLog saved = jobLogRepo.save(job);

        // 6. Push status to SharePoint AFTER this transaction commits — NOT inside it.
        // changeStatus + updateStatusIfBackedByOldExcel are blocking network calls; running them
        // here pins the pooled DB connection for the whole HTTP round-trip. On the hub that
        // starved the 20-connection pool and produced the historical >10-min "connection leak"
        // (getAll was the victim waiting for a connection). The AFTER_COMMIT listener below runs
        // once this tx has committed and its connection is released. Write-back is best-effort.
        eventPublisher.publishEvent(new WorkRequestProcessedEvent(wr.getId(), wr.getSharepointId()));

        return jobLogMapper.convertToDto(saved);
    }

    /**
     * SharePoint write-back for a processed WorkRequest. Fires only after
     * {@link #processWorkRequest}'s transaction commits, and runs with NO transaction
     * ({@code NOT_SUPPORTED}) so its blocking HTTP calls never hold a pooled DB connection.
     * Best-effort: every failure is logged, never propagated.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public void onWorkRequestProcessed(WorkRequestProcessedEvent event) {
        try {
            if (event.sharepointId() != null && !event.sharepointId().isEmpty()) {
                wrAdapter.changeStatus(event.sharepointId(), "Processed");
            }
        } catch (Exception e) {
            log.warn("[ProcessWR] SharePoint status update failed for WR id={}, spId={}: {}",
                    event.workRequestId(), event.sharepointId(), e.getMessage());
        }
        try {
            WorkRequest wr = workRequestRepo.findById(event.workRequestId()).orElse(null);
            if (wr != null) {
                oldWorkRequestExcelStatusService.updateStatusIfBackedByOldExcel(wr, "Processed");
            }
        } catch (Exception e) {
            log.warn("[ProcessWR] Old-Excel status update failed for WR id={}: {}",
                    event.workRequestId(), e.getMessage());
        }
    }

    /** Signals that a WorkRequest was processed and its SharePoint status should be pushed post-commit. */
    public record WorkRequestProcessedEvent(Long workRequestId, String sharepointId) {}

    public List<Map<String, Object>> findMatchingJobs(String workRequestId) {
        WorkRequest wr = workRequestRepo.findById(Long.parseLong(workRequestId))
                .orElseThrow(() -> new RuntimeException("WorkRequest not found: " + workRequestId));

        List<JobLog> openJobs = jobLogRepo.findAllOpenJobs();
        List<Map<String, Object>> scored = new ArrayList<>();

        for (JobLog job : openJobs) {
            double score = 0.0;
            List<String> matchReasons = new ArrayList<>();

            // Company match (strongest signal, weight 40)
            if (wr.getCompany() != null && job.getCompany() != null) {
                if (wr.getCompany().equalsIgnoreCase(job.getCompany())) {
                    score += 40;
                    matchReasons.add("Exact company match");
                } else if (job.getCompany().toLowerCase().contains(wr.getCompany().toLowerCase())
                        || wr.getCompany().toLowerCase().contains(job.getCompany().toLowerCase())) {
                    score += 25;
                    matchReasons.add("Partial company match");
                }
            }

            // WorkArea match (weight 30)
            if (wr.getWorkArea() != null && job.getWorkArea() != null
                    && wr.getWorkArea().getId().equals(job.getWorkArea().getId())) {
                score += 30;
                matchReasons.add("Same work area");
            }

            // WorkCategory match (weight 20)
            if (wr.getWorkCategory() != null && job.getWorkCategory() != null
                    && wr.getWorkCategory().getId().equals(job.getWorkCategory().getId())) {
                score += 20;
                matchReasons.add("Same work category");
            }

            // Location text match (weight 15)
            if (wr.getLocation() != null && job.getLocation() != null) {
                if (wr.getLocation().equalsIgnoreCase(job.getLocation())) {
                    score += 15;
                    matchReasons.add("Exact location match");
                } else if (job.getLocation().toLowerCase().contains(wr.getLocation().toLowerCase())
                        || wr.getLocation().toLowerCase().contains(job.getLocation().toLowerCase())) {
                    score += 8;
                    matchReasons.add("Partial location match");
                }
            }

            // Date overlap (weight 15)
            if (wr.getDateOfWorkToBePerformed() != null && job.getStartDate() != null) {
                try {
                    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd/yyyy");
                    LocalDate wrDate = LocalDate.parse(wr.getDateOfWorkToBePerformed(), fmt);
                    LocalDate jobStart = LocalDate.parse(job.getStartDate(), fmt);
                    LocalDate jobEnd = job.getEndDate() != null && !job.getEndDate().isEmpty()
                            ? LocalDate.parse(job.getEndDate(), fmt) : null;

                    boolean inRange = !wrDate.isBefore(jobStart)
                            && (jobEnd == null || !wrDate.isAfter(jobEnd));
                    if (inRange) {
                        score += 15;
                        matchReasons.add("Date within job range");
                    }
                } catch (Exception ignored) {
                    // Malformed date strings — skip date scoring
                }
            }

            if (score > 0) {
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("jobId", job.getId());
                match.put("permitNumber", job.getPermitNumber());
                match.put("company", job.getCompany());
                match.put("location", job.getLocation());
                match.put("workScope", job.getWorkScope());
                match.put("startDate", job.getStartDate());
                match.put("endDate", job.getEndDate());
                match.put("status", job.getJobStatus() != null ? job.getJobStatus().getName() : "");
                match.put("workAreaName", job.getWorkArea() != null ? job.getWorkArea().getName() : "");
                match.put("packageCount", job.getPackages() != null ? job.getPackages().size() : 0);
                match.put("score", score);
                match.put("matchReasons", matchReasons);
                scored.add(match);
            }
        }

        scored.sort((a, b) -> Double.compare((double) b.get("score"), (double) a.get("score")));
        return scored;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) + "..." : value;
    }

}
