-- PostgreSQL-specific schema initialization (hub profile)
-- Equivalent of schema.sql but with PostgreSQL syntax

-- Clean orphan FK references before Hibernate adds constraints (ignored on fresh DB via continue-on-error)
UPDATE loto_point SET zero_energy_id = NULL WHERE zero_energy_id IS NOT NULL AND zero_energy_id NOT IN (SELECT id FROM zero_energy);

CREATE SEQUENCE IF NOT EXISTS id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999999
    CYCLE;

-- Widen work_scope to TEXT (unlimited length)
ALTER TABLE IF EXISTS work_request ALTER COLUMN work_scope TYPE TEXT;

-- Update alias column to TEXT to support longer values (e.g., JSON data)
ALTER TABLE IF EXISTS val_table ALTER COLUMN alias TYPE TEXT;

-- Add missing columns to loto_boxes table for LED control
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS r INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS g INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS b INTEGER DEFAULT 32;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS brightness INTEGER DEFAULT 255;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS range_start INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS range_end INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS description VARCHAR(255);
ALTER TABLE IF EXISTS loto_boxes ADD COLUMN IF NOT EXISTS led_strip_id BIGINT;

-- Add PWA submitter fields to work_request
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS local_uuid VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS time_submitted VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_name VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(255);
ALTER TABLE IF EXISTS work_request ADD COLUMN IF NOT EXISTS submitter_company VARCHAR(255);

-- Instrumentation dedup and lookup indexes
CREATE INDEX IF NOT EXISTS idx_instrument_sharepoint_id ON instrument(sharepoint_id);
CREATE INDEX IF NOT EXISTS idx_instrument_local_uuid ON instrument(local_uuid);
CREATE INDEX IF NOT EXISTS idx_instrument_tag_number ON instrument(tag_number);
CREATE INDEX IF NOT EXISTS idx_instrument_log_sharepoint_id ON instrument_log(sharepoint_id);
CREATE INDEX IF NOT EXISTS idx_instrument_log_local_uuid ON instrument_log(local_uuid);
CREATE INDEX IF NOT EXISTS idx_instrument_log_tag_number ON instrument_log(instrument_tag_number);

-- Best-effort uniqueness constraints for dedup keys (non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS uk_instrument_sharepoint_id ON instrument(sharepoint_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_instrument_local_uuid ON instrument(local_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS uk_instrument_log_sharepoint_id ON instrument_log(sharepoint_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_instrument_log_local_uuid ON instrument_log(local_uuid);

-- SDS Sync PDFs tombstone-propagation columns on permit_attachment.
-- `deleted` carries the tombstone flag through the attachment sync channel so a delete on one
-- machine propagates to every peer. `origin` marks scraper-owned rows ('ebinder') so the Sync
-- PDFs tool can distinguish them from manual uploads (which stay null).
-- Hibernate ddl-auto=update silently skips NOT NULL columns added to existing tables — hence
-- this explicit ALTER with a DB-level default so existing rows backfill to deleted=false.
ALTER TABLE IF EXISTS permit_attachment ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS permit_attachment ADD COLUMN IF NOT EXISTS origin VARCHAR(32);
CREATE INDEX IF NOT EXISTS idx_permit_attachment_deleted ON permit_attachment(deleted);
