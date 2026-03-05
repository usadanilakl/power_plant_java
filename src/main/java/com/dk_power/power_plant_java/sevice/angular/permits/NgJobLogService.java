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
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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
        job.setName(wr.getWorkScope());
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
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto removePackageFromJob(String jobId, String packageId) {
        JobLog job = getEntityById(jobId);
        job.getPackages().removeIf(pkg -> pkg.getId().equals(Long.parseLong(packageId)));
        JobLog saved = jobLogRepo.save(job);
        return jobLogMapper.convertToDto(saved);
    }

    public JobLogDto createEmptyPackageForJob(String jobId) {
        JobLog job = getEntityById(jobId);
        DailyPermitPackage pkg = new DailyPermitPackage();
        pkg.setName(job.getName() + " - Package " + (job.getPackages().size() + 1));
        pkg.setCompanyName(job.getCompany());
        pkg.setPermitNumber(permitNumberGenerator.generate(job.getStartDate()));
        job.getPackages().add(pkg);
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
}
