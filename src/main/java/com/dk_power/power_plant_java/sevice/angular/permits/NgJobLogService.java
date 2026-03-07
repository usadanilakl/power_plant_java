package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.DailyPermitPackageMapper;
import com.dk_power.power_plant_java.mappers.permits.JobLogMapper;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
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
    private final WorkRequestRepo workRequestRepo;
    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final NgValueService ngValueService;
    private final WorkRequestSharePointAdapter wrAdapter;

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
        job.setJobStatus(ngValueService.createValue("Job Status", "Open"));

        JobLog saved = jobLogRepo.save(job);
        saved.setPermitNumber(permitNumberGenerator.generate(saved.getStartDate()));
        saved = jobLogRepo.save(saved);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto addDailyPackage(String jobId, DailyPermitPackageDto packageDto) {
        JobLog job = getEntityById(jobId);
        DailyPermitPackage pkg = dailyPermitPackageMapper.convertToEntity(packageDto);
        job.getPackages().add(pkg);
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

        job.getPackages().removeIf(p -> p.getId().equals(pkgId));
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
        job.getPackages().add(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto updateJob(String id, JobLogDto dto) {
        JobLog entity = jobLogMapper.convertToEntity(dto);
        entity.setId(Long.parseLong(id));
        JobLog saved = jobLogRepo.save(entity);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto getByPackageId(String packageId) {
        return jobLogRepo.findByPackageId(Long.parseLong(packageId))
                .map(jobLogMapper::convertToDto)
                .orElse(null);
    }

    public List<JobLogDto> getAllDtos() {
        return jobLogRepo.findAll().stream()
                .map(jobLogMapper::convertToDto)
                .collect(Collectors.toList());
    }

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
        jobLogRepo.save(job);
        jobLogRepo.delete(job);
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

        // Use native SQL to move the package without triggering orphanRemoval
        entityManager.createNativeQuery("UPDATE daily_permit_package SET job_log_id = :targetId WHERE id = :pkgId AND job_log_id = :sourceId")
                .setParameter("targetId", targetId)
                .setParameter("pkgId", pkgId)
                .setParameter("sourceId", sourceId)
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();

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

        // Move all packages via native SQL
        entityManager.createNativeQuery("UPDATE daily_permit_package SET job_log_id = :targetId WHERE job_log_id = :sourceId")
                .setParameter("targetId", targetId)
                .setParameter("sourceId", sourceId)
                .executeUpdate();
        entityManager.flush();
        entityManager.clear();

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
        pkg.getWorkRequests().add(wr);

        // 4. Attach package to job
        job.getPackages().add(pkg);
        job.setDateModified(java.time.LocalDateTime.now()); // Force dirty for OneToMany change tracking

        // 5. Persist
        JobLog saved = jobLogRepo.save(job);

        // 6. Push status to SharePoint (best-effort)
        try {
            if (wr.getSharepointId() != null && !wr.getSharepointId().isEmpty()) {
                wrAdapter.changeStatus(wr.getSharepointId(), "Processed");
            }
        } catch (Exception e) {
            log.warn("[ProcessWR] Failed to update SharePoint status for WR id={}, spId={}: {}",
                    workRequestId, wr.getSharepointId(), e.getMessage());
        }

        return jobLogMapper.convertToDto(saved);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) + "..." : value;
    }
}
