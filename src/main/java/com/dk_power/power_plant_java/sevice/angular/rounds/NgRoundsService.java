package com.dk_power.power_plant_java.sevice.angular.rounds;

import com.dk_power.power_plant_java.dto.rounds.RoundsReportDto;
import com.dk_power.power_plant_java.entities.rounds.RoundsReport;
import com.dk_power.power_plant_java.mappers.rounds.RoundsReportMapper;
import com.dk_power.power_plant_java.repository.rounds.RoundsReportRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Stores and retrieves scraped WebView AMS "Rounds" report snapshots.
 *
 * <p>Implements {@link CrudService} so the entity is sync-capable: the CRDT
 * field-sync infrastructure resolves this service via {@code ServiceFacade}
 * to apply incoming {@link RoundsReport} changes from the hub. The parsed
 * table is held verbatim as JSON on the entity.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgRoundsService
        implements CrudService<RoundsReport, RoundsReportDto, RoundsReportRepository, RoundsReportMapper> {

    private final RoundsReportRepository repo;
    private final RoundsReportMapper roundsReportMapper;
    private final SessionFactory sessionFactory;
    private final ObjectMapper objectMapper;

    // ── CrudService contract (used by the sync infrastructure) ───────────

    @Override public RoundsReport getEntity() { return new RoundsReport(); }
    @Override public RoundsReportDto getDto() { return new RoundsReportDto(); }
    @Override public RoundsReportRepository getRepo() { return repo; }
    @Override public RoundsReportMapper getMapper() { return roundsReportMapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }

    // ── Feature API ──────────────────────────────────────────────────────

    /**
     * Persist a scraped report snapshot. If an identical snapshot (same
     * {@code contentHash}) is already stored, nothing is inserted and the
     * existing latest report is returned instead.
     */
    public RoundsReportDto saveSnapshot(RoundsReportDto dto) {
        if (dto.getContentHash() != null && !dto.getContentHash().isBlank()
                && repo.existsByContentHash(dto.getContentHash())) {
            return repo.findTopByOrderByIdDesc().map(this::toFullDto).orElse(dto);
        }
        return toFullDto(repo.save(toRoundsEntity(dto)));
    }

    /** Most recent stored report, including the full parsed table. */
    @Transactional(readOnly = true)
    public RoundsReportDto getLatest() {
        return repo.findTopByOrderByIdDesc().map(this::toFullDto).orElse(null);
    }

    /** A specific stored report by id, including the full parsed table. */
    @Transactional(readOnly = true)
    public RoundsReportDto getById(Long id) {
        return repo.findById(id).map(this::toFullDto).orElse(null);
    }

    /** Recent reports as lightweight metadata (no columns/rows payload). */
    @Transactional(readOnly = true)
    public List<RoundsReportDto> getRecent() {
        return repo.findTop50ByOrderByIdDesc().stream().map(this::toMetaDto).toList();
    }

    // ── mapping ──────────────────────────────────────────────────────────

    private RoundsReport toRoundsEntity(RoundsReportDto dto) {
        RoundsReport e = new RoundsReport();
        e.setTitle(dto.getTitle());
        e.setFacility(dto.getFacility());
        e.setGeneratedAt(dto.getGeneratedAt());
        e.setFilterLine(dto.getFilterLine());
        e.setResultCount(dto.getResultCount());
        e.setContentHash(dto.getContentHash());
        e.setScrapedAt(dto.getScrapedAt());

        List<String> columns = dto.getColumns() != null ? dto.getColumns() : new ArrayList<>();
        List<List<String>> rows = dto.getRows() != null ? dto.getRows() : new ArrayList<>();
        e.setColumnCount(columns.size());
        e.setRowCount(rows.size());
        e.setColumnsJson(writeJson(columns));
        e.setRowsJson(writeJson(rows));
        return e;
    }

    /** Metadata-only DTO — no columns/rows. */
    private RoundsReportDto toMetaDto(RoundsReport e) {
        RoundsReportDto dto = new RoundsReportDto();
        dto.setId(e.getId());
        dto.setTitle(e.getTitle());
        dto.setFacility(e.getFacility());
        dto.setGeneratedAt(e.getGeneratedAt());
        dto.setFilterLine(e.getFilterLine());
        dto.setResultCount(e.getResultCount());
        dto.setRowCount(e.getRowCount());
        dto.setColumnCount(e.getColumnCount());
        dto.setContentHash(e.getContentHash());
        dto.setScrapedAt(e.getScrapedAt());
        dto.setDateCreated(e.getDateCreated());
        return dto;
    }

    /** Metadata DTO plus the full parsed table. */
    private RoundsReportDto toFullDto(RoundsReport e) {
        RoundsReportDto dto = toMetaDto(e);
        dto.setColumns(readStringList(e.getColumnsJson()));
        dto.setRows(readRows(e.getRowsJson()));
        return dto;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serialize rounds report JSON", ex);
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private List<List<String>> readRows(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<List<String>>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }
}
