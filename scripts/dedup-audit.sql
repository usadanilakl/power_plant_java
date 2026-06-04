-- ============================================================================
-- DEDUP AUDIT SCRIPT (H2 + Postgres compatible)
--
-- Captures key metrics into a snapshot table at three points in deployment,
-- then emits a PASS/FAIL diff across them.
--
-- USAGE (run via H2 web console at /h2-console or psql for hub):
--   1. SECTION 0 — verify table names. Adjust if any line returns 0 rows.
--   2. SECTION 1 — one-time table setup. Idempotent, safe to re-run.
--   3. SECTION 2 — change @LABEL to one of 'baseline' | 'post-boot' | 'post-admin',
--      then run. Capture all three labels at the right deployment moments:
--        baseline   — BEFORE deploying the new JAR
--        post-boot  — AFTER hub starts on new JAR, AFTER StartupMergeRunner completes
--        post-admin — AFTER admin "Find Orphans" + "Apply Dedup" for every category
--   4. SECTION 3 — DIFF. Run after all three captures. Any 'FAIL' rows mean
--      data loss or a missing remap — STOP and investigate before continuing.
--
-- Note for Postgres: INFORMATION_SCHEMA returns lower-case table names. Replace
-- `TABLE_SCHEMA = 'PUBLIC'` with `TABLE_SCHEMA = 'public'` and the UPPER() in
-- the WHERE clause of section 0 with no-op. Otherwise the script is portable.
-- ============================================================================


-- ============================================================================
-- SECTION 0 — Table-name pre-flight. Adjust the rest of the script if any of
-- these don't match. Each row shows the schema's name for one logical table.
-- ============================================================================
SELECT 'val_table' AS expected, TABLE_NAME AS actual FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'VAL_TABLE'
UNION ALL SELECT 'category', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'CATEGORY'
UNION ALL SELECT 'dedup_id_remap', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'DEDUP_ID_REMAP'
UNION ALL SELECT 'file_object', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) IN ('FILE_OBJECT', 'FILE')
UNION ALL SELECT 'equipment', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'EQUIPMENT'
UNION ALL SELECT 'loto_point', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'LOTO_POINT'
UNION ALL SELECT 'loto_standard_groups', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'LOTO_STANDARD_GROUPS'
UNION ALL SELECT 'work_area_location', TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'PUBLIC' AND UPPER(TABLE_NAME) = 'WORK_AREA_LOCATION'
ORDER BY 1;


-- ============================================================================
-- SECTION 1 — One-time setup (idempotent). Stores snapshots across runs.
-- ============================================================================
CREATE TABLE IF NOT EXISTS dedup_audit_snapshot (
  snapshot_label VARCHAR(64) NOT NULL,
  metric_key VARCHAR(128) NOT NULL,
  value BIGINT NOT NULL,
  captured_at TIMESTAMP NOT NULL,
  PRIMARY KEY (snapshot_label, metric_key)
);


-- ============================================================================
-- SECTION 2 — CAPTURE. Change @LABEL below, then run the whole section.
--
-- IMPORTANT: H2 console preserves session variables between Execute clicks
-- within the same session. If you reconnect, set @LABEL again before INSERT.
-- Postgres: replace `SET @LABEL = '...'` with `\set LABEL '...'` (psql) and
-- replace `@LABEL` references with `:'LABEL'`, OR just hard-code the literal.
-- ============================================================================

SET @LABEL = 'baseline';  -- one of: 'baseline' | 'post-boot' | 'post-admin'

-- Clear any prior capture for this label so reruns are clean.
DELETE FROM dedup_audit_snapshot WHERE snapshot_label = @LABEL;

INSERT INTO dedup_audit_snapshot (snapshot_label, metric_key, value, captured_at)
-- Value/Category counts ----------------------------------------------------
SELECT @LABEL, 'val_alive',    COUNT(*), CURRENT_TIMESTAMP FROM val_table WHERE deleted = FALSE
UNION ALL SELECT @LABEL, 'val_deleted',  COUNT(*), CURRENT_TIMESTAMP FROM val_table WHERE deleted = TRUE
UNION ALL SELECT @LABEL, 'cat_alive',    COUNT(*), CURRENT_TIMESTAMP FROM category WHERE deleted = FALSE
UNION ALL SELECT @LABEL, 'cat_deleted',  COUNT(*), CURRENT_TIMESTAMP FROM category WHERE deleted = TRUE
UNION ALL SELECT @LABEL, 'remap_rows',   COUNT(*), CURRENT_TIMESTAMP FROM dedup_id_remap

-- FK reference counts ------------------------------------------------------
-- These MUST stay constant or only increase between snapshots. A drop means
-- references were nulled = data loss.
UNION ALL SELECT @LABEL, 'fk_file_vendor',        COUNT(*), CURRENT_TIMESTAMP FROM file_object WHERE vendor_id IS NOT NULL
UNION ALL SELECT @LABEL, 'fk_file_file_type',     COUNT(*), CURRENT_TIMESTAMP FROM file_object WHERE file_type_id IS NOT NULL
UNION ALL SELECT @LABEL, 'fk_file_system',        COUNT(*), CURRENT_TIMESTAMP FROM file_object WHERE system_id IS NOT NULL
UNION ALL SELECT @LABEL, 'fk_equipment_system',   COUNT(*), CURRENT_TIMESTAMP FROM equipment   WHERE system_id IS NOT NULL
UNION ALL SELECT @LABEL, 'rows_loto_point',       COUNT(*), CURRENT_TIMESTAMP FROM loto_point

-- ManyToMany join-table row counts -----------------------------------------
-- Repointing changes WHICH value_id a row points to, never the row count.
UNION ALL SELECT @LABEL, 'mm_loto_standard_groups', COUNT(*), CURRENT_TIMESTAMP FROM loto_standard_groups
UNION ALL SELECT @LABEL, 'mm_work_area_location',   COUNT(*), CURRENT_TIMESTAMP FROM work_area_location

-- SAFETY CHECKS ------------------------------------------------------------
-- Number of soft-deleted Values still referenced by some entity FK.
-- Must be 0 at all three snapshots. Non-zero = orphan with dangling refs =
-- empty-dropdown bug.
UNION ALL SELECT @LABEL, 'dangling_referenced_values', COUNT(DISTINCT v.id), CURRENT_TIMESTAMP
  FROM val_table v WHERE v.deleted = TRUE AND v.id IN (
    SELECT vendor_id      FROM file_object WHERE vendor_id      IS NOT NULL
    UNION SELECT file_type_id   FROM file_object WHERE file_type_id   IS NOT NULL
    UNION SELECT system_id      FROM file_object WHERE system_id      IS NOT NULL
    UNION SELECT system_id      FROM equipment   WHERE system_id      IS NOT NULL
    UNION SELECT value_id       FROM loto_standard_groups
    UNION SELECT location_id    FROM work_area_location
  )

-- Soft-deleted Values without a redirect row in dedup_id_remap.
-- Baseline value is grandfathered (pre-existing damage). post-boot and
-- post-admin must NOT exceed baseline — any new soft-delete must come with
-- its remap row, or incoming sync changes referencing that ID can't resolve.
UNION ALL SELECT @LABEL, 'soft_deleted_without_remap', COUNT(*), CURRENT_TIMESTAMP
  FROM val_table v WHERE v.deleted = TRUE
    AND NOT EXISTS (SELECT 1 FROM dedup_id_remap r
                    WHERE r.entity_type = 'Value' AND r.original_id = v.id);

-- Print what was captured.
SELECT metric_key, value FROM dedup_audit_snapshot
  WHERE snapshot_label = @LABEL ORDER BY metric_key;


-- ============================================================================
-- SECTION 3 — DIFF / PASS-FAIL. Run after all three captures.
-- ============================================================================
WITH metrics AS (
  SELECT
    metric_key,
    MAX(CASE WHEN snapshot_label = 'baseline'   THEN value END) AS baseline,
    MAX(CASE WHEN snapshot_label = 'post-boot'  THEN value END) AS post_boot,
    MAX(CASE WHEN snapshot_label = 'post-admin' THEN value END) AS post_admin
  FROM dedup_audit_snapshot
  WHERE snapshot_label IN ('baseline', 'post-boot', 'post-admin')
  GROUP BY metric_key
)
SELECT
  metric_key,
  baseline,
  post_boot,
  post_admin,
  (post_boot  - baseline)  AS delta_boot,
  (post_admin - post_boot) AS delta_admin,
  CASE
    -- FK reference counts: must NEVER decrease.
    WHEN metric_key IN ('fk_file_vendor', 'fk_file_file_type', 'fk_file_system',
                        'fk_equipment_system', 'rows_loto_point',
                        'mm_loto_standard_groups', 'mm_work_area_location') THEN
      CASE WHEN post_boot < baseline OR post_admin < baseline
           THEN 'FAIL: ref/row count DECREASED — data loss'
           ELSE 'PASS' END

    -- Dangling referenced values: must be 0 at all three snapshots.
    WHEN metric_key = 'dangling_referenced_values' THEN
      CASE WHEN COALESCE(baseline,0) = 0 AND COALESCE(post_boot,0) = 0 AND COALESCE(post_admin,0) = 0
           THEN 'PASS'
           WHEN COALESCE(baseline,0) > 0 AND COALESCE(post_boot,0) = 0 AND COALESCE(post_admin,0) = 0
           THEN 'PASS: recovery cleared pre-existing dangling refs'
           ELSE 'FAIL: dangling references present — empty-dropdown risk'
      END

    -- Soft-deleted-without-remap: post-snapshots cannot exceed baseline.
    -- New soft-deletes MUST come with a remap row.
    WHEN metric_key = 'soft_deleted_without_remap' THEN
      CASE WHEN COALESCE(post_boot,0) <= COALESCE(baseline,0)
            AND COALESCE(post_admin,0) <= COALESCE(baseline,0)
           THEN 'PASS'
           ELSE 'FAIL: orphan soft-deleted without dedup_id_remap row'
      END

    -- Value/Category bookkeeping: informational, but sanity-check that
    -- merges happened where we expect them.
    WHEN metric_key = 'val_alive' THEN
      CASE WHEN COALESCE(post_admin,0) <= COALESCE(baseline,0) THEN 'INFO: alive count down (merges OK)'
           ELSE 'INFO: alive count up (new values were created during run)' END
    WHEN metric_key = 'val_deleted' THEN
      CASE WHEN COALESCE(post_admin,0) >= COALESCE(baseline,0) THEN 'INFO: deleted count up (merges OK)'
           ELSE 'INFO: deleted count DOWN (unexpected)' END
    WHEN metric_key = 'remap_rows' THEN
      CASE WHEN COALESCE(post_admin,0) >= COALESCE(baseline,0) THEN 'INFO: remap rows added'
           ELSE 'INFO: remap rows DOWN (unexpected)' END

    ELSE 'INFO'
  END AS status
FROM metrics
ORDER BY
  CASE WHEN status LIKE 'FAIL%' THEN 0 ELSE 1 END,
  metric_key;


-- ============================================================================
-- SECTION 4 — Spot-check details (run if anything in section 3 is FAIL).
-- ============================================================================

-- Which soft-deleted Values are MISSING a remap row right now?
SELECT v.id, v.name, v.alias, v.category_id, c.alias AS cat_alias
FROM val_table v LEFT JOIN category c ON c.id = v.category_id
WHERE v.deleted = TRUE
  AND NOT EXISTS (SELECT 1 FROM dedup_id_remap r
                  WHERE r.entity_type = 'Value' AND r.original_id = v.id)
ORDER BY v.id;

-- Which entity rows are still pointing at a soft-deleted Value?
-- (Dangling references — the empty-dropdown root cause.)
SELECT 'file_object.vendor_id'    AS location, fo.id AS entity_id, v.id AS value_id, v.name
  FROM file_object fo JOIN val_table v ON v.id = fo.vendor_id WHERE v.deleted = TRUE
UNION ALL SELECT 'file_object.file_type_id', fo.id, v.id, v.name
  FROM file_object fo JOIN val_table v ON v.id = fo.file_type_id WHERE v.deleted = TRUE
UNION ALL SELECT 'file_object.system_id', fo.id, v.id, v.name
  FROM file_object fo JOIN val_table v ON v.id = fo.system_id WHERE v.deleted = TRUE
UNION ALL SELECT 'equipment.system_id', e.id, v.id, v.name
  FROM equipment e JOIN val_table v ON v.id = e.system_id WHERE v.deleted = TRUE
UNION ALL SELECT 'loto_standard_groups.value_id', lsg.loto_standard_id, v.id, v.name
  FROM loto_standard_groups lsg JOIN val_table v ON v.id = lsg.value_id WHERE v.deleted = TRUE
UNION ALL SELECT 'work_area_location.location_id', wal.work_area_id, v.id, v.name
  FROM work_area_location wal JOIN val_table v ON v.id = wal.location_id WHERE v.deleted = TRUE
ORDER BY 1, 2;

-- Cleanup (optional) — drop the snapshot table after deployment verification.
-- DROP TABLE dedup_audit_snapshot;
