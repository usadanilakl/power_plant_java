package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.RedTagStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.RedTagStandardMatchDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.RedTagStandard;
import com.dk_power.power_plant_java.entities.loto.RedTagStandardRow;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.RedTagStandardRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * CRUD + manual seed import for {@link RedTagStandard}.
 *
 * <p>The import is deliberately <strong>not</strong> a startup runner: this
 * app runs on many desktop clients that all sync to a shared hub, so an
 * auto-seed would create duplicate rows on every client. Import is instead
 * triggered explicitly by an admin via {@code POST /ng/red-tag-standards/import}
 * and is idempotent — a standard whose name already exists is skipped.
 *
 * <p>See {@code project/features/loto-standard/red-tag-standards-plan.md}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NgRedTagStandardService {

    private static final String SEED_JSON = "red-tag-standards/seed.json";
    private static final String IMAGE_DIR = "red-tag-standards/images/";

    private final RedTagStandardRepo repo;
    private final ObjectMapper objectMapper;
    private final LotoPointRepo lotoPointRepo;
    private final NgLotoStandardService ngLotoStandardService;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RedTagStandardDto> getAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public RedTagStandardDto getById(Long id) {
        return toDto(requireStandard(id));
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    /** Update the editable fields of a Red Tag standard (rows, notes, unit, name). */
    public RedTagStandardDto update(Long id, RedTagStandardDto dto) {
        RedTagStandard s = requireStandard(id);
        if (dto.getName() != null) s.setName(dto.getName());
        if (dto.getUnit() != null) s.setUnit(dto.getUnit());
        if (dto.getImportNotes() != null) s.setImportNotes(dto.getImportNotes());
        if (dto.getRows() != null) s.setRows(dto.getRows());
        return toDto(repo.save(s));
    }

    public void delete(Long id) {
        RedTagStandard s = requireStandard(id);
        s.setDeleted(true);
        repo.save(s);
    }

    // ── Manual seed import ────────────────────────────────────────────────────

    /** Result summary for the import endpoint. */
    public record ImportResult(int created, int skipped, List<String> createdNames, List<String> skippedNames) {}

    /**
     * Load {@code red-tag-standards/seed.json} from the classpath and create a
     * {@link RedTagStandard} for every entry not already present (matched by
     * name, case-insensitive). Each entry's source image is read from
     * {@code red-tag-standards/images/} and stored base64-encoded.
     */
    public ImportResult importSeed() {
        List<SeedEntry> entries = readSeed();
        List<String> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (SeedEntry entry : entries) {
            if (entry.name == null || entry.name.isBlank()) continue;
            if (repo.findFirstByNameIgnoreCase(entry.name.trim()) != null) {
                skipped.add(entry.name);
                continue;
            }
            RedTagStandard s = new RedTagStandard();
            s.setName(entry.name.trim());
            s.setUnit(entry.unit);
            s.setRows(entry.rows != null ? entry.rows : new ArrayList<>());
            s.setSourceImageBase64(loadImageBase64(entry.image));
            repo.save(s);
            created.add(entry.name);
        }
        return new ImportResult(created.size(), skipped.size(), created, skipped);
    }

    private List<SeedEntry> readSeed() {
        try (InputStream in = new ClassPathResource(SEED_JSON).getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<List<SeedEntry>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Failed to read Red Tag standards seed: " + e.getMessage(), e);
        }
    }

    /** Reads a seed image from the classpath and base64-encodes it. Null/missing → null. */
    private String loadImageBase64(String imageFile) {
        if (imageFile == null || imageFile.isBlank()) return null;
        try (InputStream in = new ClassPathResource(IMAGE_DIR + imageFile).getInputStream()) {
            return Base64.getEncoder().encodeToString(in.readAllBytes());
        } catch (Exception e) {
            // Missing image isn't fatal — the standard still imports, just without a picture.
            return null;
        }
    }

    /** Seed-file row — mirrors the JSON shape in seed.json. */
    private static final class SeedEntry {
        public String name;
        public String unit;
        public String image;
        public List<RedTagStandardRow> rows;
    }

    // ── Reconciliation: match rows to existing LOTO points ───────────────────

    /**
     * For each row of the Red Tag standard, resolve the existing LOTO points
     * whose tag number matches the row's PNID (case-insensitive). Returns one
     * {@link RedTagStandardMatchDto} per row with a MATCHED / MULTIPLE / NONE
     * status the UI renders as a badge.
     */
    @Transactional(readOnly = true)
    public List<RedTagStandardMatchDto> getMatches(Long id) {
        RedTagStandard s = requireStandard(id);
        List<RedTagStandardRow> rows = s.getRows();

        // Batch-load every candidate point in one query, then group by upper(tag).
        List<String> pnids = rows.stream()
                .map(RedTagStandardRow::getPnid)
                .filter(p -> p != null && !p.isBlank())
                .map(p -> p.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        Map<String, List<LotoPoint>> byTag = new LinkedHashMap<>();
        if (!pnids.isEmpty()) {
            for (LotoPoint p : lotoPointRepo.findByTagNumberUpperIn(pnids)) {
                if (p.getTagNumber() == null) continue;
                byTag.computeIfAbsent(p.getTagNumber().trim().toUpperCase(Locale.ROOT), k -> new ArrayList<>())
                        .add(p);
            }
        }

        List<RedTagStandardMatchDto> result = new ArrayList<>();
        for (RedTagStandardRow row : rows) {
            String key = row.getPnid() == null ? "" : row.getPnid().trim().toUpperCase(Locale.ROOT);
            List<LotoPoint> hits = byTag.getOrDefault(key, List.of());
            List<RedTagStandardMatchDto.MatchedPoint> matches = hits.stream()
                    .map(p -> new RedTagStandardMatchDto.MatchedPoint(
                            p.getId(), p.getTagNumber(), p.getDescription()))
                    .toList();
            RedTagStandardMatchDto.Status status =
                    matches.isEmpty() ? RedTagStandardMatchDto.Status.NONE
                    : matches.size() == 1 ? RedTagStandardMatchDto.Status.MATCHED
                    : RedTagStandardMatchDto.Status.MULTIPLE;
            result.add(new RedTagStandardMatchDto(row, status, matches));
        }
        return result;
    }

    // ── Generate a native LotoStandard from reconciled points ────────────────

    /**
     * Create a new {@link com.dk_power.power_plant_java.entities.loto.LotoStandard}
     * from the user-selected LOTO point ids, stamp {@code generatedStandardId}
     * on this Red Tag standard, and return the new standard's DTO.
     */
    public LotoStandardDto generateStandard(Long id, String name, List<Long> lotoPointIds) {
        RedTagStandard s = requireStandard(id);
        if (lotoPointIds == null || lotoPointIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one LOTO point to generate a standard");
        }
        LotoStandardIdDto idDto = new LotoStandardIdDto();
        idDto.setName((name != null && !name.isBlank()) ? name.trim() : s.getName());
        idDto.setDescription("Generated from Red Tag standard: " + s.getName());
        idDto.setLotoPoints(new ArrayList<>(lotoPointIds));

        LotoStandardDto created = ngLotoStandardService.createStandard(idDto);
        s.setGeneratedStandardId(created.getId());
        repo.save(s);
        return created;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    RedTagStandard requireStandard(Long id) {
        if (id == null) throw new IllegalArgumentException("Red Tag standard id required");
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RedTagStandard not found: " + id));
    }

    RedTagStandardDto toDto(RedTagStandard s) {
        RedTagStandardDto dto = new RedTagStandardDto();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setUnit(s.getUnit());
        dto.setRows(s.getRows());
        dto.setSourceImageBase64(s.getSourceImageBase64());
        dto.setGeneratedStandardId(s.getGeneratedStandardId());
        dto.setImportNotes(s.getImportNotes());
        dto.setDateCreated(s.getDateCreated() != null ? s.getDateCreated().toString() : null);
        dto.setDateModified(s.getDateModified() != null ? s.getDateModified().toString() : null);
        return dto;
    }
}
